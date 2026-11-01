import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { MessageMarkdownComponents } from "@/src/pages/admin/bots/[bot_id]/(data)/message-markdown-components";
import linkComputerRefs from "@/src/utils/link-computer-refs";

/**
 * Kept module-level: a new array on every render makes `react-markdown`
 * parse the message again.
 */
const RemarkPlugins = [remarkGfm];

type Props = {
    label: string;
    text: string;
};

/**
 * What a hook call's run answered, rendered like a chat message (raw HTML
 * never).
 */
export default function HookCallAnswer({ label, text }: Props) {
    return (
        <Stack className="w-full gap-0.5! items-stretch">
            <Span className="text-[11px] leading-4 text-ink-secondary">{label}</Span>
            <Stack className="w-full gap-2.5! items-start break-words">
                <Markdown remarkPlugins={RemarkPlugins} components={MessageMarkdownComponents}>
                    {linkComputerRefs({ text })}
                </Markdown>
            </Stack>
        </Stack>
    );
}
