import { useState } from "react";
import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { Plus } from "lucide-react";
import type { EnvScope, EnvsOverviewPayload, PublicEnv } from "@/src/types";
import SettingsGroup from "../../(partials)/settings-group";
import EnvForm from "./env-form";
import EnvRow from "./env-row";

type Props = {
    scope: EnvScope;
    /**
     * The scope's own envs (app settings left out).
     */
    envs: PublicEnv[];
    onChanged: (overview: EnvsOverviewPayload, msg: string) => void;
    onError: (msg: string) => void;
};

const Descriptions: Record<EnvScope["paradigm"], string> = {
    general: "Set on every computer. A workspace or computer can set the same key to override it.",
    workspace: "Set on this workspace's computers when its bots use them. Beats general, loses to a computer's own.",
    computer: "Set on this computer only. Beats workspace and general.",
};

/**
 * The envs bots and computers use, in one scope, with an add form.
 */
export default function EnvsGroup({ scope, envs, onChanged, onError }: Props) {
    const [adding, setAdding] = useState(false);

    return (
        <SettingsGroup title="Envs" description={Descriptions[scope.paradigm]}>
            <Stack className="w-full gap-0! items-stretch">
                {envs.map((env) => (
                    <EnvRow
                        key={env.id}
                        scope={scope}
                        env={env}
                        onChanged={onChanged}
                        onError={onError}
                    />
                ))}
                {envs.length ? null : (
                    <Span className="text-[13px] leading-5 text-ink-secondary py-3">
                        Nothing set here yet.
                    </Span>
                )}
            </Stack>
            {adding ? (
                <EnvForm
                    scope={scope}
                    onSaved={(overview, msg) => {
                        setAdding(false);
                        onChanged(overview, msg);
                    }}
                    onCancel={() => setAdding(false)}
                />
            ) : (
                <Row className="gap-3! items-center justify-end">
                    <Button
                        title="Add an env"
                        type="button"
                        variant="outlined"
                        color="gray"
                        size="small"
                        onClick={() => setAdding(true)}
                    >
                        <Plus size={16} aria-hidden />
                        Add an env
                    </Button>
                </Row>
            )}
        </SettingsGroup>
    );
}
