import Markdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import Stack from "@moduletrace/twui/layout/Stack";
import linkComputerRefs from "@/src/utils/link-computer-refs";
import { UserMarkdownComponents } from "../(data)/user-markdown-components";
import { QuotableAttribute } from "../(hooks)/use-message-selection";

/**
 * Ink bubble with paper text; inverts in dark mode. The text is markdown
 * (GFM; raw HTML is never rendered) as the composer writes it, a single
 * line break kept as one, so older plain messages read as typed. Bots
 * and workspaces it mentions show as chips.
 */
export default function UserBubble({ text }: { text: string }) {
    return (
        <Stack
            {...{ [QuotableAttribute]: "" }}
            className="max-w-[80%] min-w-0 gap-2.5! items-stretch rounded-default-lg bg-ink text-on-ink px-4 py-3 text-sm leading-5 break-words"
        >
            <Markdown remarkPlugins={[remarkGfm, remarkBreaks]} components={UserMarkdownComponents}>
                {linkComputerRefs({ text })}
            </Markdown>
        </Stack>
    );
}
