import { useContext, useState } from "react";
import { AppContext } from "@/src/pages/__root";
import type { EnvsMutationResult, EnvsOverviewPayload } from "@/src/types";
import EnvsGroup from "../../(partials)/envs/envs-group";
import postEnvApi from "../../(functions)/post-env-api";
import PersonalSecretsGroup from "../../(partials)/secrets/personal-secrets-group";
import EnvScopeSelect from "../(partials)/env-scope-select";
import KnownEnvsGroup from "../(partials)/known-envs-group";
import scopeValue, { envInScope } from "../(utils)/scope-value";

/**
 * Pick where (general, a workspace, a bot or a computer), then that scope's
 * envs. General also lists the app settings. Below, every user's personal
 * secrets (set from the chat), which can only be removed here. Every change
 * saves at once and refreshes the page data.
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
    const [removing, setRemoving] = useState<number>();

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
            <PersonalSecretsGroup
                title="Personal secrets"
                description="What users gave their bots from the chat, each for one user's runs of one bot. Only its user can see or replace one; you can remove it."
                secrets={overview.personal || []}
                show_user
                busy_id={removing}
                onRemove={async ({ secret }) => {
                    if (!window.confirm(`Remove ${secret.user_name}'s ${secret.key} for ${secret.bot_name}?`)) return;

                    setRemoving(secret.id);
                    const res = await postEnvApi({ path: "delete-env", body: { env_id: secret.id } }).catch(() => null);
                    setRemoving(undefined);

                    if (res?.success && res.singleRes) changed(res.singleRes, res.msg || "Removed.");
                    else failed(res?.msg || "Couldn't remove it.");
                }}
            />
        </>
    );
}
