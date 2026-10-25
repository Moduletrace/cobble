import type { PersonalSecret } from "@/src/types";
import SettingsGroup from "../settings-group";
import SettingsList from "../settings-list";
import SettingsStatus from "../settings-status";
import PersonalSecretRow from "./personal-secret-row";

type Props = {
    title: string;
    description: string;
    secrets: PersonalSecret[];
    show_user?: boolean;
    busy_id?: number;
    status?: { error?: boolean; success?: boolean; msg?: string };
    onReplace?: (params: { secret: PersonalSecret; value: string }) => Promise<boolean>;
    onRemove: (params: { secret: PersonalSecret }) => void;
};

/**
 * A list of personal secrets (set from the chat), values never shown: the
 * user's own on the Secrets page, everyone's on the Environment page.
 */
export default function PersonalSecretsGroup({
    title,
    description,
    secrets,
    show_user,
    busy_id,
    status,
    onReplace,
    onRemove,
}: Props) {
    return (
        <SettingsGroup title={title} description={description}>
            <SettingsList is_empty={!secrets.length} empty="No secrets saved yet.">
                {secrets.map((secret) => (
                    <PersonalSecretRow
                        key={secret.id}
                        secret={secret}
                        show_user={show_user}
                        busy={busy_id == secret.id}
                        onReplace={onReplace}
                        onRemove={onRemove}
                    />
                ))}
            </SettingsList>
            <SettingsStatus status={status} />
        </SettingsGroup>
    );
}
