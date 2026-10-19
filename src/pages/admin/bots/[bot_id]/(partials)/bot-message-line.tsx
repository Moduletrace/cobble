import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Row from "@moduletrace/twui/layout/Row";
import Stack from "@moduletrace/twui/layout/Stack";
import linkComputerRefs from "@/src/utils/link-computer-refs";
import { MessageMarkdownComponents } from "../(data)/message-markdown-components";
import GroupTimestamp from "./group-timestamp";
import NeedsYouChip from "./needs-you-chip";
import SpeakMessageButton from "./speak-message-button";

type Props = {
    message_id?: number | null;
    text: string;
    needs_you?: boolean;
    /**
     * The group's time, on the last message only: shown beside its play
     * button.
     */
    at?: number;
};

/**
 * One bot message, rendered from markdown (GFM; raw HTML is never
 * rendered). Computers it names (`computerRef`) show as buttons that
 * switch the bot to them. A play button under it reads it aloud,
 * disabled while the bot has no speech model, with the group's time
 * before it on the last message.
 */
export default function BotMessageLine({ message_id, text, needs_you, at }: Props) {
    const can_speak = Boolean(message_id && text.trim());

    return (
        <Stack className="gap-1.5! items-start max-w-full">
            <Stack className="w-full gap-2.5! items-start break-words">
                <Markdown
                    remarkPlugins={[remarkGfm]}
                    components={MessageMarkdownComponents}
                >
                    {linkComputerRefs({ text })}
                </Markdown>
            </Stack>
            {needs_you || can_speak || at ? (
                <Row className="gap-2! items-center">
                    {needs_you ? <NeedsYouChip /> : null}
                    {at ? <GroupTimestamp at={at} /> : null}
                    {can_speak ? (
                        <SpeakMessageButton message_id={message_id!} />
                    ) : null}
                </Row>
            ) : null}
        </Stack>
    );
}
