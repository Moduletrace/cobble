import { useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import postSessionApi from "@/src/functions/frontend/post-session-api";
import HeaderIconButton from "@/src/components/general/header-icon-button";
import HeaderMenuItem from "./header-menu-item";

type Props = {
    bot_id: number;
    workspace_id?: number | null;
    /**
     * Shown as a row in the conversation header's menu instead of an icon
     * beside it.
     */
    menu?: boolean;
    /**
     * A menu row closing the menu before it starts the session.
     */
    on_open?: () => void;
};

/**
 * Closes this session and starts a fresh one that carries a summary of
 * it, then shows it.
 */
export default function NewSessionButton({
    bot_id,
    workspace_id,
    menu,
    on_open,
}: Props) {
    const [loading, setLoading] = useState(false);

    const start = async () => {
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
    };

    if (menu) {
        return (
            <HeaderMenuItem
                icon={MessageSquarePlus}
                title="New session"
                loading={loading}
                disabled={loading}
                onClick={() => {
                    on_open?.();
                    start();
                }}
            />
        );
    }

    return (
        <HeaderIconButton
            icon={MessageSquarePlus}
            title="New session"
            loading={loading}
            disabled={loading}
            onClick={start}
        />
    );
}
