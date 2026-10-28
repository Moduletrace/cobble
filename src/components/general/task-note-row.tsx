import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import type { TaskNote } from "@/src/types";
import relativeTime from "@/src/utils/relative-time";

type Props = {
    note: TaskNote;
};

/**
 * One note on an opened task: who wrote it (the user, or the bot by name),
 * how long ago, and what it says.
 */
export default function TaskNoteRow({ note }: Props) {
    const author = note.author == "user" ? "You" : note.bot_name || "Bot";

    return (
        <Stack className="w-full gap-0.5! items-stretch py-1.5 border-0 border-b border-solid border-hairline last:border-b-0">
            <Row className="w-full gap-2! flex-nowrap items-center">
                <Span className="text-[12px] font-bold leading-4 text-ink">{author}</Span>
                {note.created_at ? (
                    <Span className="text-[11px] leading-4 text-ink-secondary">
                        {relativeTime({ at: Number(note.created_at) })}
                    </Span>
                ) : null}
            </Row>
            <Span className="whitespace-pre-wrap text-[13px] leading-[18px] text-ink">{note.text}</Span>
        </Stack>
    );
}
