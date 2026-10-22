import { useContext, useState } from "react";
import { AppContext } from "@/src/pages/__root";
import type { EnvsMutationResult, EnvsOverviewPayload } from "@/src/types";
import EnvsGroup from "../../(partials)/envs/envs-group";
import EnvScopeSelect from "../(partials)/env-scope-select";
import KnownEnvsGroup from "../(partials)/known-envs-group";
import scopeValue, { envInScope } from "../(utils)/scope-value";

/**
 * Pick where (general, a workspace, a bot or a computer), then that scope's
 * envs. General also lists the app settings. Every change saves at once and
 * refreshes the page data.
 */
export default function EnvironmentSettingsSection() {
    const { pageProps } = useContext(AppContext);
    const [overview, setOverview] = useState(pageProps?.envs_overview);
    const [selected, setSelected] = useState("general");
    const [status, setStatus] = useState<{ error?: boolean; success?: boolean; msg?: string }>();
    /**
     * Remounts the lists when the data changes under them.
     */
    const [version, setVersion] = useState(0);

    if (!overview) return null;

    const scope =
        overview.scopes.find((s) => scopeValue({ scope: s }) == selected) || overview.scopes[0]!;

    const changed = (result: EnvsMutationResult, msg: string) => {
        if (result.overview) setOverview(result.overview);
        setStatus({ success: true, msg });
        setVersion((prev) => prev + 1);
    };
    const failed = (msg: string) => setStatus({ error: true, msg });

    return (
        <>
            <EnvScopeSelect
                scopes={overview.scopes}
                value={scopeValue({ scope })}
                status={status}
                onChange={(next) => {
                    setSelected(next);
                    setStatus(undefined);
                }}
            />
            {scope.paradigm == "general" ? (
                <KnownEnvsGroup
                    key={`known-${version}`}
                    scope={scope}
                    overview={overview}
                    onChanged={changed}
                    onError={failed}
                />
            ) : null}
            <EnvsGroup
                key={`${scopeValue({ scope })}-${version}`}
                scope={scope}
                envs={overview.envs.filter((env) => !env.known && envInScope({ env, scope }))}
                onChanged={changed}
                onError={failed}
            />
        </>
    );
}
