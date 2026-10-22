import Select from "@moduletrace/twui/form/Select";
import type { EnvScope } from "@/src/types";
import SettingsGroup from "../../(partials)/settings-group";
import SettingsStatus from "../../(partials)/settings-status";
import scopeValue from "../(utils)/scope-value";

type Props = {
    scopes: EnvScope[];
    value: string;
    onChange: (value: string) => void;
    status?: { error?: boolean; success?: boolean; msg?: string };
};

/**
 * Where the envs below apply: general, a workspace, a bot or a computer.
 * Also shows the last change's status.
 */
export default function EnvScopeSelect({ scopes, value, onChange, status }: Props) {
    return (
        <SettingsGroup
            title="Where"
            description="A bot's own envs beat everything. Then the computer's own, then the workspace's, then general."
        >
            <Select
                id="env-scope"
                title="Where"
                label="Where"
                showLabel
                options={scopes.map((scope) => ({
                    value: scopeValue({ scope }),
                    title: scope.title,
                    default: scopeValue({ scope }) == value,
                }))}
                changeHandler={(next) => onChange(String(next))}
            />
            <SettingsStatus status={status} />
        </SettingsGroup>
    );
}
