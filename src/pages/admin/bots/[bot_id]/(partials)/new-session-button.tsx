import { useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import postSessionApi from "@/src/functions/frontend/post-session-api";
import HeaderIconButton from "@/src/components/general/header-icon-button";

type Props = {
    bot_id: number;
    workspace_id?: number | null;
};

/**
 * Beside the sessions icon: closes this session and starts a fresh one
 * that carries a summary of it, then shows it.
 */
export default function NewSessionButton({ bot_id, workspace_id }: Props) {
    const [loading, setLoading] = useState(false);

    return (
        <HeaderIconButton
            icon={MessageSquarePlus}
            title="New session"
            loading={loading}
            disabled={loading}
            onClick={async () => {
                setLoading(true);

                const res = await postSessionApi({
                    path: "new-session",
                    body: { bot_id, workspace_id },
                }).catch(() => null);

                if (res?.success) {
                    window.location.reload();
                    return;
                }

                setLoading(false);
                window.alert(res?.msg || "Couldn't start a new session.");
            }}
        />
    );
}
