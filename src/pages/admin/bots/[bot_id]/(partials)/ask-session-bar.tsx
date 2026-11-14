import { useEffect, useState } from "react";
import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { ArrowLeft } from "lucide-react";
import conversationHref from "@/src/utils/conversation-href";
import type { AskOverview } from "@/src/types";

type Props = {
    bot_id: number;
    workspace_id?: number | null;
    /**
     * The session on screen: the bar shows only when it is a request's.
     */
    session_id: number | null;
};

/**
 * Above the composer of a session a crew request opened: the way back to
 * the conversation the user was in before it, which `startBotSession`
 * closed to give the request a thread of its own.
 */
export default function AskSessionBar({ bot_id, workspace_id, session_id }: Props) {
    const [ask, setAsk] = useState<AskOverview | null>(null);

    useEffect(() => {
        if (!session_id) {
            setAsk(null);
            return;
        }

        let live = true;

        fetch(`/api/admin/bots/ask?session_id=${session_id}`)
            .then((res) => res.json())
            .then((data: { success?: boolean; singleRes?: AskOverview }) => {
                if (live) setAsk(data?.success ? data.singleRes || null : null);
            })
            .catch(() => {
                if (live) setAsk(null);
            });

        return () => {
            live = false;
        };
    }, [session_id]);

    if (!ask?.previous_session_id) return null;

    return (
        <Stack className="shrink-0 gap-0! items-stretch border-0 border-t border-solid border-hairline">
            <Row className="w-full max-w-container mx-auto py-3 gap-3! md:gap-4! flex-nowrap items-center justify-between px-3 md:px-6">
                <Span className="min-w-0 text-sm text-ink-secondary truncate">
                    {ask.requester_name
                        ? `This session is a crew request from ${ask.requester_name}.`
                        : "This session is a crew request."}
                </Span>
                <Button
                    title="Go back to the conversation before this request"
                    type="button"
                    size="small"
                    href={conversationHref({
                        bot_id,
                        workspace_id,
                        session_id: ask.previous_session_id,
                    })}
                    beforeIcon={<ArrowLeft size={14} aria-hidden />}
                    variant="outlined"
                    className="shrink-0"
                >
                    Back to the previous session
                </Button>
            </Row>
        </Stack>
    );
}
