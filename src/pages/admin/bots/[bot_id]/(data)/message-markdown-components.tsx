import type { Components } from "react-markdown";
import Divider from "@moduletrace/twui/layout/Divider";
import H3 from "@moduletrace/twui/layout/H3";
import H4 from "@moduletrace/twui/layout/H4";
import H5 from "@moduletrace/twui/layout/H5";
import P from "@moduletrace/twui/layout/P";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import MarkdownCodeBlock from "../(partials)/markdown-code-block";
import MarkdownLink from "../(partials)/markdown-link";
import MarkdownList from "../(partials)/markdown-list";

const HeadingClassName = "my-0! text-[15px]! leading-6! tracking-normal! font-bold text-ink";

/**
 * How a bot message's markdown renders: chat-sized twui elements (headings
 * no bigger than the bot's name), lists through twui's `List`, code on the
 * sunken surface, and links that open in a new tab or switch computers.
 * Tables (GFM) have no children-based twui equivalent, so they're styled
 * elements.
 */
export const MessageMarkdownComponents: Components = {
    p: ({ children }) => (
        <P noMargin className="w-full text-sm leading-5 text-ink">
            {children}
        </P>
    ),
    h1: ({ children }) => <H3 className={HeadingClassName}>{children}</H3>,
    h2: ({ children }) => <H3 className={HeadingClassName}>{children}</H3>,
    h3: ({ children }) => <H4 className={HeadingClassName}>{children}</H4>,
    h4: ({ children }) => <H5 className={HeadingClassName}>{children}</H5>,
    h5: ({ children }) => <H5 className={HeadingClassName}>{children}</H5>,
    h6: ({ children }) => <H5 className={HeadingClassName}>{children}</H5>,
    strong: ({ children }) => <Span className="font-bold">{children}</Span>,
    em: ({ children }) => <Span className="italic">{children}</Span>,
    del: ({ children }) => <Span className="line-through">{children}</Span>,
    a: MarkdownLink,
    ul: ({ children }) => <MarkdownList>{children}</MarkdownList>,
    ol: ({ children, start }) => (
        <MarkdownList ordered start={start}>
            {children}
        </MarkdownList>
    ),
    code: ({ children }) => (
        <Span className="font-mono text-[13px] px-1 py-px rounded-default-xs bg-sunken text-ink wrap-anywhere">
            {children}
        </Span>
    ),
    pre: ({ children }) => <MarkdownCodeBlock>{children}</MarkdownCodeBlock>,
    blockquote: ({ children }) => (
        <Stack className="gap-2! items-stretch pl-3 border-0 border-l-2 border-solid border-hairline-strong text-ink-secondary">
            {children}
        </Stack>
    ),
    hr: () => <Divider className="my-1 border-hairline dark:border-hairline" />,
    img: ({ src, alt }) => (
        <MarkdownLink href={typeof src == "string" ? src : undefined}>{alt || "Image"}</MarkdownLink>
    ),
    table: ({ children }) => (
        <Stack className="w-full max-w-full overflow-x-auto items-start">
            <table className="text-[13px] leading-5 text-ink border-collapse wrap-break-word">{children}</table>
        </Stack>
    ),
    th: ({ children }) => (
        <th className="px-3 py-1.5 text-left font-bold border border-solid border-hairline">{children}</th>
    ),
    td: ({ children }) => (
        <td className="px-3 py-1.5 align-top border border-solid border-hairline">{children}</td>
    ),
};
