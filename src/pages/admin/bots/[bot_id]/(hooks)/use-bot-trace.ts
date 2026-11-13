import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import { useCallback, useEffect, useRef, useState } from "react";
import useServerEvent from "@/src/hooks/use-server-event";
import type { BotTraceData, BotTraceJob } from "@/src/types";

type Params = {
    /**
     * The session the conversation shows: its runs' traces are what the
     * debug view lists.
     */
    session_id?: number | null;
    /**
     * The view is on screen. Nothing is read, and no push is taken, while
     * it's closed.
     */
    open: boolean;
};

/**
 * How long after the first push a reload waits, so a run that keeps
 * tracing through its tools reads once rather than once per step.
 */
const ReloadGapMs = 500;

/**
 * What a conversation's runs did in detail (`bot_job_traces`): read when
 * the debug view opens and on `server:bot-trace`, which names only the job
 * and its session, so the view reads the entries it doesn't have.
 */
export default function useBotTrace({ session_id, open }: Params) {
    const [jobs, setJobs] = useState<BotTraceJob[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const load = useCallback(async () => {
        if (!session_id) return;

        setLoading(true);
        setError(undefined);

        const res = await fetchApi<{}, APIResponseObject<BotTraceJob[]>>(
            "/api/admin/bots/trace",
            { method: "POST", body: { session_id } },
        ).catch(() => null);

        setLoading(false);

        if (!res?.success) {
            setError(res?.msg || `Couldn't load the trace.`);
            return;
        }

        setJobs(res.singleRes || []);
    }, [session_id]);

    /**
     * One reload is enough for everything written while it was waiting.
     */
    const schedule = useCallback(() => {
        if (timer.current) return;

        timer.current = setTimeout(() => {
            timer.current = null;
            load().catch(() => {});
        }, ReloadGapMs);
    }, [load]);

    useEffect(() => {
        if (!open) return;

        setJobs([]);
        load().catch(() => {});
    }, [open, session_id]);

    useServerEvent({
        event: "server:bot-trace",
        onData: (data: BotTraceData) => {
            if (!open || data?.session_id != session_id) return;

            schedule();
        },
    });

    /**
     * A run that ends pushes its message, not a trace: the view reads once
     * more so its last entries and its status are right.
     */
    useServerEvent({
        event: "server:bot-message",
        onData: (data: { session_id?: number } | undefined) => {
            if (!open || data?.session_id != session_id) return;

            schedule();
        },
    });

    useEffect(
        () => () => {
            if (timer.current) clearTimeout(timer.current);
        },
        [],
    );

    return { jobs, loading, error, reload: load };
}