import { ArrowRight } from "lucide-react";
import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import conversationHref from "@/src/utils/conversation-href";

type Props = {
    bot_id: number;
    workspace_id?: number | null;
    /**
     * The session the one on screen was carried into.
     */
    moved_to_session_id: number;
};

/**
 * Takes the composer's place under a session that was carried over into
 * a newer one (by the bot, Continue in new session or the rollover): it
 * stays closed, to read, and points to where the conversation went on.
 */
export default function SessionMovedBar({ bot_id, workspace_id, moved_to_session_id }: Props) {
    return (
        <Stack className="shrink-0 gap-0! items-stretch border-0 border-t border-solid border-hairline">
            <Row className="w-full max-w-container mx-auto min-h-[88px] py-7 gap-3! md:gap-4! flex-nowrap items-center justify-between px-3 md:px-6">
                <Span className="text-sm text-ink-secondary">
                    This conversation moved to a new session. This one stays as it was, to read.
                </Span>
                <Button
                    title="Continue in the newer session"
                    type="button"
                    size="small"
                    href={conversationHref({ bot_id, workspace_id, session_id: moved_to_session_id })}
                    afterIcon={<ArrowRight size={14} aria-hidden />}
                    variant="outlined"
                    className="shrink-0"
                >
                    Continue there
                </Button>
            </Row>
        </Stack>
    );
}
