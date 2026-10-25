import { useContext, useState } from "react";
import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import { AppContext } from "@/src/pages/__root";
import type { PersonalSecret } from "@/src/types";
import PersonalSecretsGroup from "../../(partials)/secrets/personal-secrets-group";

/**
 * The user's own personal secrets, with Replace and Remove. Every change
 * saves at once and refreshes the list.
 */
export default function SecretsSettingsSection() {
    const { pageProps } = useContext(AppContext);
    const [secrets, setSecrets] = useState<PersonalSecret[]>(pageProps?.personal_secrets || []);
    const [busy_id, setBusyId] = useState<number>();
    const [status, setStatus] = useState<{ error?: boolean; success?: boolean; msg?: string }>();

    const post = async ({ path, body }: { path: "save-secret" | "delete-secret"; body: Record<string, unknown> }) => {
        const res = await fetchApi<Record<string, unknown>, APIResponseObject<PersonalSecret[]>>(
            `/api/admin/secrets/${path}`,
            { method: "POST", body },
        ).catch(() => null);

        if (res?.success && res.singleRes) {
            setSecrets(res.singleRes);
            setStatus({ success: true, msg: res.msg || "Saved." });
            return true;
        }

        setStatus({ error: true, msg: res?.msg || "Couldn't save it." });
        return false;
    };

    return (
        <PersonalSecretsGroup
            title="Your secrets"
            description="Each one is for one bot and only your runs of it. Bots ask for them with a card in the chat, never in a message."
            secrets={secrets}
            busy_id={busy_id}
            status={status}
            onReplace={async ({ secret, value }) => {
                if (!window.confirm(`Replace ${secret.key} for ${secret.bot_name}?`)) return false;

                setBusyId(secret.id);
                const ok = await post({ path: "save-secret", body: { env_id: secret.id, value } });
                setBusyId(undefined);

                return ok;
            }}
            onRemove={async ({ secret }) => {
                if (!window.confirm(`Remove ${secret.key} for ${secret.bot_name}? Its computers drop it on their next run.`)) return;

                setBusyId(secret.id);
                await post({ path: "delete-secret", body: { env_id: secret.id } });
                setBusyId(undefined);
            }}
        />
    );
}
