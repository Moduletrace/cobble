import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { twMerge } from "tailwind-merge";
import H2 from "@moduletrace/twui/layout/H2";
import H3 from "@moduletrace/twui/layout/H3";
import H4 from "@moduletrace/twui/layout/H4";
import H5 from "@moduletrace/twui/layout/H5";
import Stack from "@moduletrace/twui/layout/Stack";
import { MessageMarkdownComponents } from "@/src/pages/admin/bots/[bot_id]/(data)/message-markdown-components";

type Props = {
    text: string;
};

const RemarkPlugins = [remarkGfm];

const HeadingClassName = "my-0! tracking-normal! font-bold text-ink";

/**
 * A message's markdown elements, with headings sized for a document
 * rather than a chat line.
 */
const DocumentComponents: Components = {
    ...MessageMarkdownComponents,
    h1: ({ children }) => <H2 className={twMerge(HeadingClassName, "text-2xl! leading-8! mt-2!")}>{children}</H2>,
    h2: ({ children }) => <H3 className={twMerge(HeadingClassName, "text-xl! leading-7! mt-2!")}>{children}</H3>,
    h3: ({ children }) => <H4 className={twMerge(HeadingClassName, "text-[17px]! leading-6! mt-1!")}>{children}</H4>,
    h4: ({ children }) => <H5 className={twMerge(HeadingClassName, "text-[15px]! leading-6!")}>{children}</H5>,
    h5: ({ children }) => <H5 className={twMerge(HeadingClassName, "text-sm! leading-5!")}>{children}</H5>,
    h6: ({ children }) => <H5 className={twMerge(HeadingClassName, "text-sm! leading-5! text-ink-secondary")}>{children}</H5>,
};

/**
 * A markdown file rendered in the preview, through the same elements as a
 * bot's messages (raw HTML never rendered), in a readable column.
 */
export default function FilePreviewMarkdown({ text }: Props) {
    return (
        <Stack className="grow min-h-0 w-full overflow-auto items-center">
            <Stack className="w-full max-w-[760px] gap-3! items-stretch px-6 py-5">
                <Markdown remarkPlugins={RemarkPlugins} components={DocumentComponents}>
                    {text}
                </Markdown>
            </Stack>
        </Stack>
    );
}
