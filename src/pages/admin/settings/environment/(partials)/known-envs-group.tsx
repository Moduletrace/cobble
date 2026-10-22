import Stack from "@moduletrace/twui/layout/Stack";
import type { EnvScope, EnvsMutationResult, EnvsOverviewPayload, PublicEnv } from "@/src/types";
import EnvRow from "../../(partials)/envs/env-row";
import SettingsGroup from "../../(partials)/settings-group";

type Props = {
    scope: EnvScope;
    overview: EnvsOverviewPayload;
    onChanged: (data: EnvsMutationResult, msg: string) => void;
    onError: (msg: string) => void;
};

/**
 * The app settings: envs the app itself reads. General only, never on
 * computers.
 */
export default function KnownEnvsGroup({ scope, overview, onChanged, onError }: Props) {
    return (
        <SettingsGroup
            title="App settings"
            description="What the app itself reads. A value here wins over the server's environment. These never reach computers or bots."
        >
            <Stack className="w-full gap-0! items-stretch">
                {overview.known.map((known) => (
                    <EnvRow
                        key={known.key}
                        scope={scope}
                        known={known}
                        env={findGeneral({ envs: overview.envs, key: known.key })}
                        onChanged={onChanged}
                        onError={onError}
                    />
                ))}
            </Stack>
        </SettingsGroup>
    );
}

function findGeneral({ envs, key }: { envs: PublicEnv[]; key: string }) {
    return envs.find((env) => env.paradigm == "general" && env.key == key);
}
