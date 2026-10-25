import { useState } from "react";
import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import { Plus } from "lucide-react";
import type { EnvScope, EnvsMutationResult, PublicEnv } from "@/src/types";
import SettingsGroup from "../settings-group";
import SettingsList from "../settings-list";
import SettingsStatus from "../settings-status";
import EnvForm from "./env-form";
import EnvRow from "./env-row";

type Props = {
    scope: EnvScope;
    /**
     * The scope's own envs (app settings left out).
     */
    envs: PublicEnv[];
    /**
     * Set when the list is a bot's or workspace's own (its settings page)
     * rather than the Environment page's overview.
     */
    scoped?: boolean;
    /**
     * The heading, when it isn't plain "Envs".
     */
    title?: string;
    status?: {
        error?: boolean;
        success?: boolean;
        msg?: string;
    };
    onChanged: (data: EnvsMutationResult, msg: string) => void;
    onError: (msg: string) => void;
};

const Descriptions: Record<EnvScope["paradigm"], string> = {
    general:
        "Set everywhere. A workspace, a bot or a computer can set the same key to override it.",
    workspace:
        "For every bot working here. Beats general, loses to the bot's own.",
    computer:
        "For this computer only. Beats a workspace, loses to the bot's own.",
    bot: "For this bot only, everywhere it works. Beats the workspace, the computer and general.",
    user: "For one user's runs of one bot, set from the chat. Beats everything else.",
};

/**
 * The envs bots and computers use, in one scope, with an add form.
 */
export default function EnvsGroup({
    scope,
    envs,
    scoped,
    title,
    status,
    onChanged,
    onError,
}: Props) {
    const [adding, setAdding] = useState(false);

    return (
        <SettingsGroup
            title={title || "Envs"}
            description={Descriptions[scope.paradigm]}
        >
            <SettingsList is_empty={!envs.length} empty="Nothing set here yet.">
                {envs.map((env) => (
                    <EnvRow
                        key={env.id}
                        scope={scope}
                        env={env}
                        scoped={scoped}
                        onChanged={onChanged}
                        onError={onError}
                    />
                ))}
            </SettingsList>
            <SettingsStatus status={status} />
            {adding ? (
                <EnvForm
                    scope={scope}
                    onSaved={(data, msg) => {
                        setAdding(false);
                        onChanged(data, msg);
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
