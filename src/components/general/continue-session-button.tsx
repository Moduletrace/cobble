import { useState } from "react";
import { MessageSquareShare } from "lucide-react";
import Button from "@moduletrace/twui/layout/Button";
import postSessionApi from "@/src/functions/frontend/post-session-api";
import conversationHref from "@/src/utils/conversation-href";

type Props = {
    bot_id: number;
    workspace_id?: number | null;
    /**
     * Renders the trigger instead of the default button (the conversation
     * menu's row), given whether it's working and the click.
     */
    render?: (params: { loading: boolean; onClick: () => void }) => React.ReactNode;
};

/**
 * Continue in new session: carries the conversation into a new session
 * with a summary of this one, as the bot does when asked
 * (`api/admin/bots/continue-session`). Unlike New session, which starts
 * fresh. Asks first, since this session then stays closed for good. It
 * stays on screen (a menu stays open) while the summary is written, which
 * takes a model call.
 */
export default function ContinueSessionButton({ bot_id, workspace_id, render }: Props) {
    const [loading, setLoading] = useState(false);

    const start = async () => {
        if (loading) return;
        if (!window.confirm("Continue in a new session? A summary of this session carries over, and this one is closed for good (you can still read it).")) return;

        setLoading(true);

        const res = await postSessionApi({
            path: "continue-session",
            body: { bot_id, workspace_id },
        }).catch(() => null);

        if (res?.success) {
            window.location.assign(conversationHref({ bot_id, workspace_id }));
            return;
        }

        setLoading(false);
        window.alert(res?.msg || "Couldn't continue in a new session.");
    };

    if (render) return <>{render({ loading, onClick: start })}</>;

    return (
        <Button
            title="Continue in a new session, with a summary of this one"
            type="button"
            size="small"
            variant="outlined"
            color="gray"
            loading={loading}
            disabled={loading}
            onClick={start}
            className="shrink-0 gap-1!"
        >
            <MessageSquareShare size={14} aria-hidden />
            Continue
        </Button>
    );
}
