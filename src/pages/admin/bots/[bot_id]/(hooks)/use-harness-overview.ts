import { useEffect, useState } from "react";
import { AppData } from "@/src/data/app-data";
import type { HarnessOverview } from "@/src/types";
import fetchHarnessOverview from "../(functions)/fetch-harness-overview";
import {
    readHarnessOverviewCache,
    writeHarnessOverviewCache,
} from "../(utils)/harness-overview-cache";

type Params = {
    bot_id: number;
    workspace_id?: number | null;
    /**
     * Loads once this turns true (the modal is about to open), not with
     * the page.
     */
    enabled: boolean;
};

/**
 * The models modal's data for a conversation. Shows what `localStorage`
 * last had at once, and fetches it again when there is none or it is
 * older than `AppData.HarnessOverviewCacheMs`. `setHarnesses` takes a
 * save's fresh data and keeps it.
 */
export default function useHarnessOverview({ bot_id, workspace_id, enabled }: Params) {
    const [harnesses, setState] = useState<HarnessOverview[]>();
    const [error, setError] = useState<string>();
    /**
     * Counts fetched updates, so a form showing the cached data remounts
     * with the fresh.
     */
    const [version, setVersion] = useState(0);

    useEffect(() => {
        if (!enabled) return;

        let cancelled = false;
        const cached = readHarnessOverviewCache({ bot_id, workspace_id });

        if (cached) setState(cached.harnesses);
        if (cached && Date.now() - cached.at < AppData.HarnessOverviewCacheMs) return;

        setError(undefined);

        fetchHarnessOverview({ bot_id, workspace_id })
            .then((res) => {
                if (cancelled) return;

                if (res.success && res.singleRes) {
                    setState(res.singleRes.harnesses);
                    setVersion((prev) => prev + 1);
                    writeHarnessOverviewCache({ bot_id, workspace_id, harnesses: res.singleRes.harnesses });
                } else if (!cached) {
                    setError(res.msg || "Couldn't load the models.");
                }
            })
            .catch(() => {
                if (!cancelled && !cached) setError("Couldn't load the models.");
            });

        return () => {
            cancelled = true;
        };
    }, [enabled, bot_id, workspace_id]);

    const setHarnesses = (fresh: HarnessOverview[]) => {
        setState(fresh);
        writeHarnessOverviewCache({ bot_id, workspace_id, harnesses: fresh });
    };

    return { harnesses, error, version, setHarnesses };
}
