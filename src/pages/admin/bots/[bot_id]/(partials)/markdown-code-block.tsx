import { isValidElement, type ReactNode } from "react";
import CodeBlock from "@moduletrace/twui/elements/CodeBlock";

/**
 * A fenced code block in a bot message, on the sunken surface with
 * twui's copy button (its icon is drawn white; recoloured to the theme).
 */
export default function MarkdownCodeBlock({ children }: { children?: ReactNode }) {
    const code = isValidElement(children)
        ? (children.props as { children?: ReactNode }).children
        : children;

    return (
        <CodeBlock
            singleBlock
            backgroundColor="var(--color-sunken)"
            wrapperProps={{
                className:
                    "max-w-full! outline-hairline dark:outline-hairline [&_.twui-code-block-header_svg]:stroke-ink-secondary",
            }}
            className="font-mono text-[13px] leading-5 text-ink py-2 pl-2 pr-10"
        >
            {code}
        </CodeBlock>
    );
}
