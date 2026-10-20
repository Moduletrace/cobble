import { useEffect, useMemo, useState } from "react";
import { AppData } from "@/src/data/app-data";
import type {
    HarnessCatalog,
    HarnessOverview,
    HarnessSettingOverview,
} from "@/src/types";
import {
    readHarnessCatalogCache,
    readHarnessSettingsCache,
    writeHarnessCatalogCache,
    writeHarnessSettingsCache,
} from "@/src/utils/harness-cache";
import fetchHarnessCatalog from "../(functions)/fetch-harness-catalog";
import fetchHarnessOverview from "../(functions)/fetch-harness-overview";
import {
    harnessCatalogFromOverview,
    harnessSettingsFromOverview,
    mergeHarnessOverview,
} from "../(utils)/harness-overview-parts";

type Params = {
    user_id: number;
    bot_id: number;
    workspace_id?: number | null;
    /**
     * Loads once this turns true (the modal is about to open), not with
     * the page.
     */
    enabled: boolean;
};

/**
 * The models modal's data for a conversation. The install-wide catalog is
 * cached once per user; the conversation's own setting is cached per bot
 * and workspace, and is small. Either shows what `localStorage` last had
 * at once and is fetched again when it is older than its
 * `AppData.Harness*CacheMs`. `setHarnesses` takes a save's fresh data and
 * keeps it.
 */
export default function useHarnessOverview({
    user_id,
    bot_id,
    workspace_id,
    enabled,
}: Params) {
    const [catalog, setCatalog] = useState<HarnessCatalog[]>();
    const [settings, setSettings] = useState<HarnessSettingOverview[]>();
    const [error, setError] = useState<string>();
    /**
     * Counts fetched settings, so a form showing cached data remounts with
     * the fresh when it isn't being edited.
     */
    const [version, setVersion] = useState(0);

    useEffect(() => {
        if (!enabled || !user_id || !bot_id) return;

        let cancelled = false;
        const cached_catalog = readHarnessCatalogCache({ user_id });
        const cached_settings = readHarnessSettingsCache({ user_id, bot_id, workspace_id });

        if (cached_catalog) setCatalog(cached_catalog.data.harnesses);
        if (cached_settings) setSettings(cached_settings.data.harnesses);

        const now = Date.now();
        const stale = (at: number | undefined, max_age_ms: number) =>
            !at || now - at >= max_age_ms;
        const need_catalog = stale(cached_catalog?.at, AppData.HarnessCatalogCacheMs);
        const need_settings = stale(cached_settings?.at, AppData.HarnessOverviewCacheMs);

        if (!need_catalog && !need_settings) return;

        setError(undefined);

        const loadCatalog = async () => {
            try {
                const res = await fetchHarnessCatalog();

                if (cancelled) return;

                if (res.success && res.singleRes) {
                    setCatalog(res.singleRes.harnesses);
                    writeHarnessCatalogCache({ user_id, data: res.singleRes });
                } else if (!cached_catalog) {
                    setError(res.msg || "Couldn't load the models.");
                }
            } catch {
                if (!cancelled && !cached_catalog) setError("Couldn't load the models.");
            }
        };

        const loadSettings = async () => {
            try {
                const res = await fetchHarnessOverview({ bot_id, workspace_id });

                if (cancelled) return;

                if (res.success && res.singleRes) {
                    setSettings(res.singleRes.harnesses);
                    setVersion((prev) => prev + 1);
                    writeHarnessSettingsCache({
                        user_id,
                        bot_id,
                        workspace_id,
                        data: res.singleRes,
                    });
                } else if (!cached_settings) {
                    setError(res.msg || "Couldn't load the models.");
                }
            } catch {
                if (!cancelled && !cached_settings) setError("Couldn't load the models.");
            }
        };

        void Promise.all([need_catalog ? loadCatalog() : null, need_settings ? loadSettings() : null]);

        return () => {
            cancelled = true;
        };
    }, [enabled, user_id, bot_id, workspace_id]);

    const harnesses = useMemo(
        () => mergeHarnessOverview({ catalog, settings }),
        [catalog, settings],
    );

    /**
     * A save answers with the full overview: keep both parts of the cache
     * current, so the next open is instant and the catalog is not fetched
     * again.
     */
    const setHarnesses = (fresh: HarnessOverview[]) => {
        const next_catalog = harnessCatalogFromOverview({ harnesses: fresh });
        const next_settings = harnessSettingsFromOverview({ harnesses: fresh });

        setCatalog(next_catalog);
        setSettings(next_settings);
        writeHarnessCatalogCache({ user_id, data: { harnesses: next_catalog } });
        writeHarnessSettingsCache({
            user_id,
            bot_id,
            workspace_id,
            data: { harnesses: next_settings },
        });
    };

    return { harnesses, error, version, setHarnesses };
}
