import Markdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import Button from "@moduletrace/twui/layout/Button";
import Stack from "@moduletrace/twui/layout/Stack";
import linkComputerRefs from "@/src/utils/link-computer-refs";
import { UserMarkdownComponents } from "../(data)/user-markdown-components";
import useBubbleClamp from "../(hooks)/use-bubble-clamp";
import { QuotableAttribute } from "../(hooks)/use-message-selection";
import { twMerge } from "tailwind-merge";

/**
 * Kept module-level: a new array on every render makes `react-markdown`
 * parse the message again.
 */
const RemarkPlugins = [remarkGfm, remarkBreaks];

/**
 * Ink bubble with paper text; inverts in dark mode. The text is markdown
 * (GFM; raw HTML is never rendered) as the composer writes it, a single
 * line break kept as one, so older plain messages read as typed. Bots
 * and workspaces it mentions show as chips. A long message is cut to the
 * twenty lines of `max-h-[25rem]` (the bubble's `leading-5`), with "Read
 * more" under it for the rest: a pasted prompt should not fill the screen.
 */
export default function UserBubble({ text }: { text: string }) {
    const { content_ref, expanded, overflows, toggle } = useBubbleClamp({
        text,
    });

    return (
        <Stack
            className={twMerge(
                "max-w-[80%] min-w-0 gap-1.5! items-stretch rounded-default-lg",
                "bg-ink text-on-ink px-4 py-3 text-sm leading-5 wrap-anywhere",
                "conversation-user-bubble",
            )}
        >
            <Stack
                {...{ [QuotableAttribute]: "" }}
                componentRef={content_ref}
                className={twMerge(
                    "min-w-0 items-stretch gap-2.5!",
                    !expanded && "max-h-[25rem] overflow-hidden",
                )}
            >
                <Markdown
                    remarkPlugins={RemarkPlugins}
                    components={UserMarkdownComponents}
                >
                    {linkComputerRefs({ text })}
                </Markdown>
            </Stack>
            {overflows ? (
                <Button
                    title={expanded ? "Show less" : "Read more"}
                    aria-expanded={expanded}
                    type="button"
                    variant="ghost"
                    color="white"
                    size="small"
                    onClick={toggle}
                    className="-ml-3 -mb-1 self-start text-on-ink/80 hover:text-on-ink"
                >
                    {expanded ? "Show less" : "Read more"}
                </Button>
            ) : null}
        </Stack>
    );
}