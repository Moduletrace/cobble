import type { ReactNode } from "react";
import CodeBlock from "@moduletrace/twui/elements/CodeBlock";
import { twMerge } from "tailwind-merge";

type Props = {
    children?: ReactNode;
    /**
     * Break long words as well as lines, so one unbroken token (a JSON
     * argument, a long path) never pushes the block wider than its panel.
     */
    wrapAnywhere?: boolean;
    className?: string;
};

/**
 * A block of code on the theme's sunken surface rather than twui's own dark
 * block (it defaults to `#28272b`): the surface follows light and dark, so
 * the text stays legible in both. twui draws the copy icon and its "Copied!"
 * label white, so both are recoloured to the ink scale, and the block is set
 * at 13px, the size the dense views around it use.
 */
export default function SunkenCodeBlock({ children, wrapAnywhere, className }: Props) {
    return (
        <CodeBlock
            singleBlock
            backgroundColor="var(--color-sunken)"
            wrapperProps={{
                className:
                    "max-w-full! outline-hairline dark:outline-hairline [&_.twui-code-block-header_svg]:stroke-ink-secondary [&_.twui-code-block-copied-text]:text-ink",
            }}
            className={twMerge(
                "font-mono text-[13px] leading-5 text-ink py-2 pl-2 pr-10",
                wrapAnywhere && "whitespace-pre-wrap wrap-anywhere",
                className,
            )}
        >
            {children}
        </CodeBlock>
    );
}