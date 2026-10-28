import { useContext, useState } from "react";
import { AppContext } from "@/src/pages/__root";
import type { HarnessOverviewPayload } from "@/src/types";
import postHarnessApi from "../(functions)/post-harness-api";
import type changedHarnessSettings from "../(utils)/changed-harness-settings";

/**
 * The providers and harness settings a page edits (the Models settings
 * and the setup), starting from the page's props and updated from the
 * fresh data every save returns. `version` remounts the harness form when
 * the data changes under it; `notice` is the last save's message, kept
 * across that remount.
 */
export default function useModelsOverview() {
    const { pageProps } = useContext(AppContext);
    const [overview, setOverview] = useState(pageProps?.harness_overview);
    const [version, setVersion] = useState(0);
    const [notice, setNotice] = useState<string>();

    const update = (next: HarnessOverviewPayload) => {
        setOverview(next);
        setNotice(undefined);
        setVersion((prev) => prev + 1);
    };

    const saveSettings = async ({
        settings,
    }: {
        settings: ReturnType<typeof changedHarnessSettings>;
    }) => {
        const res = await postHarnessApi({
            path: "save-settings",
            body: { settings },
        });

        if (res.success && res.singleRes) {
            update(res.singleRes);
            setNotice(res.msg || "Saved.");
        }

        return res;
    };

    return { overview, version, notice, update, saveSettings };
}
