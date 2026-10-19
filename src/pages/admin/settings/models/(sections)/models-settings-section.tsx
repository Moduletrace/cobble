import { useContext, useState } from "react";
import { AppContext } from "@/src/pages/__root";
import HarnessSettingsForm from "../(partials)/harness-settings-form";
import ProvidersGroup from "../(partials)/providers-group";
import postHarnessApi from "../(functions)/post-harness-api";

/**
 * Providers first (where models come from), then what each harness uses.
 * Both update from the fresh data every save returns.
 */
export default function ModelsSettingsSection() {
    const { pageProps } = useContext(AppContext);
    const [overview, setOverview] = useState(pageProps?.harness_overview);
    /**
     * Remounts the harness form when the data changes under it.
     */
    const [version, setVersion] = useState(0);
    const [notice, setNotice] = useState<string>();

    if (!overview) return null;

    const update = (next: typeof overview) => {
        setOverview(next);
        setNotice(undefined);
        setVersion((prev) => prev + 1);
    };

    return (
        <>
            <ProvidersGroup providers={overview.providers} onChanged={update} />
            <HarnessSettingsForm
                key={version}
                harnesses={overview.harnesses}
                notice={notice}
                save={async ({ settings }) => {
                    const res = await postHarnessApi({
                        path: "save-settings",
                        body: { settings },
                    });

                    if (res.success && res.singleRes) {
                        update(res.singleRes);
                        setNotice(res.msg || "Saved.");
                    }

                    return res;
                }}
            />
        </>
    );
}
