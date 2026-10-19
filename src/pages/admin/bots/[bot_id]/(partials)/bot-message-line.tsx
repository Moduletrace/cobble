import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Stack from "@moduletrace/twui/layout/Stack";
import linkComputerRefs from "@/src/utils/link-computer-refs";
import { MessageMarkdownComponents } from "../(data)/message-markdown-components";
import NeedsYouChip from "./needs-you-chip";

type Props = {
    text: string;
    needs_you?: boolean;
};

/**
 * One bot message, rendered from markdown (GFM; raw HTML is never
 * rendered). Computers it names (`computerRef`) show as buttons that
 * switch the bot to them.
 */
export default function BotMessageLine({ text, needs_you }: Props) {
    return (
        <Stack className="gap-1.5! items-start max-w-full">
            <Stack className="w-full gap-2.5! items-start break-words">
                <Markdown remarkPlugins={[remarkGfm]} components={MessageMarkdownComponents}>
                    {linkComputerRefs({ text })}
                </Markdown>
            </Stack>
            {needs_you ? <NeedsYouChip /> : null}
        </Stack>
    );
}
