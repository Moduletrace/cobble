import type { Components } from "react-markdown";
import P from "@moduletrace/twui/layout/P";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import MarkdownList from "../(partials)/markdown-list";
import UserMarkdownLink from "../(partials)/user-markdown-link";
import { MessageMarkdownComponents } from "./message-markdown-components";

const Heading: Components["h1"] = ({ children }) => (
    <P noMargin className="text-sm leading-5 font-bold text-on-ink">
        {children}
    </P>
);

/**
 * The user's own message markdown, on the ink bubble: the chat's
 * components (`MessageMarkdownComponents`) in the bubble's colours, and
 * headings no bigger than the text. Code blocks and ref chips keep their
 * own surface.
 */
export const UserMarkdownComponents: Components = {
    ...MessageMarkdownComponents,
    p: ({ children }) => (
        <P noMargin className="text-sm leading-5 text-on-ink">
            {children}
        </P>
    ),
    h1: Heading,
    h2: Heading,
    h3: Heading,
    h4: Heading,
    h5: Heading,
    h6: Heading,
    a: UserMarkdownLink,
    ul: ({ children }) => <MarkdownList className="text-on-ink">{children}</MarkdownList>,
    ol: ({ children, start }) => (
        <MarkdownList ordered start={start} className="text-on-ink">
            {children}
        </MarkdownList>
    ),
    code: ({ children }) => (
        <Span className="font-mono text-[13px] px-1 py-px rounded-default-xs bg-on-ink/15 text-on-ink break-words">
            {children}
        </Span>
    ),
    blockquote: ({ children }) => (
        <Stack className="gap-2! items-stretch pl-3 border-0 border-l-2 border-solid border-on-ink/40 opacity-80">
            {children}
        </Stack>
    ),
};
