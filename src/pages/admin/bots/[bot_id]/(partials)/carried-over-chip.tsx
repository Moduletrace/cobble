import { History } from "lucide-react";
import Button from "@moduletrace/twui/layout/Button";
import conversationHref from "@/src/utils/conversation-href";

type Props = {
    bot_id: number | string;
    workspace_id?: number | string | null;
    /**
     * The session the summary carries on from.
     */
    session_id: number | string;
};

/**
 * Heads the summary that opens a session the bot moved the conversation
 * into (`continue_in_new_session`), and opens the session it carries on
 * from to read. The thread's "Show the previous session" shows the same
 * messages in place; this is the other way there, on purpose.
 */
export default function CarriedOverChip({ bot_id, workspace_id, session_id }: Props) {
    return (
        <Button
            type="button"
            variant="outlined"
            color="gray"
            size="smaller"
            title="Open the session this one carries on from"
            href={conversationHref({ bot_id, workspace_id, session_id })}
            beforeIcon={<History size={14} aria-hidden className="shrink-0" />}
            className="inline-flex h-6 gap-1.5! flex-nowrap align-middle px-2! text-[11px] font-bold whitespace-nowrap text-ink dark:text-ink bg-transparent hover:bg-sunken"
        >
            Carried over from the last session
        </Button>
    );
}
