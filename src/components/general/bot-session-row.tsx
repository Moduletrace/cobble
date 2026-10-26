import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { twMerge } from "tailwind-merge";
import type { BotSessionListItem } from "@/src/types";
import messagePreview from "@/src/utils/message-preview";
import relativeTime from "@/src/utils/relative-time";

type Props = {
    session: BotSessionListItem;
    loading?: boolean;
    disabled?: boolean;
    onOpen: () => void;
    /**
     * The session the page shows (`?session_id=`, else the active one):
     * marked Current and greyed out.
     */
    current: boolean;
};

/**
 * One session in the sessions modal: its title, the summary or last
 * message, how long and how recent. The one on screen is
 * Current (greyed out); any other opens on click (reopening a closed one,
 * going back to the active one).
 */
export default function BotSessionRow({ session, loading, disabled, onOpen, current }: Props) {
    const preview = session.summary || session.last_message_text || "";
    const at = session.last_activity_at || session.created_at;

    return (
        <Button
            title={
                current
                    ? "This is the session on screen"
                    : session.status == "active"
                      ? "Go back to the active session"
                      : `Reopen "${session.title || "Untitled"}"`
            }
            type="button"
            variant="ghost"
            color="text"
            loading={loading}
            disabled={current || disabled}
            onClick={onOpen}
            buttonContentProps={{ className: "w-full min-w-0 flex-nowrap" }}
            className={twMerge(
                "w-full justify-start! items-start! gap-0! px-3! py-2.5! rounded-default text-left text-ink dark:text-ink hover:bg-ink/5 hover:dark:bg-ink/5 focus-visible:ring-2 focus-visible:ring-ink",
                current && "bg-sunken hover:bg-sunken hover:dark:bg-sunken opacity-100!",
            )}
        >
            <Stack className="w-full min-w-0 gap-0.5! items-stretch">
                <Row className="w-full gap-2! flex-nowrap items-center">
                    <Span
                        className={twMerge(
                            "grow min-w-0 truncate text-sm font-bold leading-5",
                            current ? "text-ink-secondary" : "text-ink",
                        )}
                    >
                        {session.title || "Untitled session"}
                    </Span>
                    {session.unread && !current ? (
                        <Span className="shrink-0 text-[11px] font-bold leading-4 text-ink">New</Span>
                    ) : null}
                    <Span className="shrink-0 text-[11px] leading-4 text-ink-secondary">
                        {current ? "Current" : at ? relativeTime({ at: Number(at) }) : ""}
                    </Span>
                </Row>
                <Span className="w-full truncate text-xs leading-4 text-ink-secondary">
                    {`${session.message_count} message${session.message_count == 1 ? "" : "s"}`}
                    {preview ? ` · ${messagePreview({ text: preview })}` : ""}
                </Span>
            </Stack>
        </Button>
    );
}
