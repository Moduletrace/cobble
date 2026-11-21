import { useCallback, useEffect, useRef, useState } from "react";
import type { BotPlanChangedData, BotPlanView } from "@/src/types";
import useServerEvent from "@/src/hooks/use-server-event";
import { BotPlanChangedEvent } from "@/src/utils/bot-plan-changed-event";
import fetchBotPlan from "../(functions)/fetch-bot-plan";

type Params = {
    plan_id: number;
};

/**
 * A plan as its card shows it (`[plan:ID]`). Read when the card renders,
 * then kept current from the app's pushes (`server:bot-plan`, sent while a
 * run works a step and when the user moves the plan), since the same card
 * sits in several messages and its steps change under them. A failed read
 * gives up rather than blocking the card forever; a push retries it.
 *
 * Read here rather than through `loadRefView`, whose cache never expires:
 * a plan is alive, and a card left showing yesterday's step is worse than
 * one that asks again.
 */
export default function useBotPlan({ plan_id }: Params) {
    const [view, setViewState] = useState<BotPlanView | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>();
    const mounted = useRef(true);

    const read = useCallback(async () => {
        try {
            const res = await fetchBotPlan({ plan_id });

            if (!mounted.current) return;

            if (res.success && res.singleRes) {
                setViewState(res.singleRes);
                setError(undefined);
            } else {
                setError(res.msg || `This plan isn't available.`);
            }
        } catch (e: unknown) {
            if (mounted.current) setError(e instanceof Error ? e.message : `This plan isn't available.`);
        } finally {
            if (mounted.current) setLoading(false);
        }
    }, [plan_id]);

    useEffect(() => {
        mounted.current = true;

        setLoading(true);
        void read();

        return () => {
            mounted.current = false;
        };
    }, [read]);

    useServerEvent({
        event: "server:bot-plan",
        onData: (data: BotPlanChangedData) => {
            if (Number(data?.plan_id) != plan_id) return;

            void read();
        },
    });

    useEffect(() => {
        const listener = (event: Event) => {
            const plan = (event as CustomEvent<{ plan?: BotPlanView }>).detail?.plan;

            if (!plan || Number(plan.id) != plan_id) return;

            setViewState(plan);
            setError(undefined);
            setLoading(false);
        };

        window.addEventListener(BotPlanChangedEvent, listener);

        return () => window.removeEventListener(BotPlanChangedEvent, listener);
    }, [plan_id]);

    /**
     * The card's own moves replace what was read, so it shows the change
     * without asking the app again.
     */
    const setView = useCallback((next: BotPlanView) => {
        setViewState(next);
        setError(undefined);
    }, []);

    return { view, loading, error, setView, reload: read };
}