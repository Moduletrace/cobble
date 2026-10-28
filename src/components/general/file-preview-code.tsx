import CodeBlock from "@moduletrace/twui/elements/CodeBlock";
import Stack from "@moduletrace/twui/layout/Stack";

type Props = {
    text: string;
};

/**
 * A plain text file in the preview, as it is, on the sunken surface with
 * twui's copy button.
 */
export default function FilePreviewCode({ text }: Props) {
    return (
        <Stack className="grow min-h-0 w-full overflow-auto p-4 items-stretch">
            <CodeBlock
                singleBlock
                backgroundColor="var(--color-sunken)"
                wrapperProps={{
                    className:
                        "max-w-full! outline-hairline dark:outline-hairline [&_.twui-code-block-header_svg]:stroke-ink-secondary",
                }}
                className="font-mono text-[13px] leading-5 text-ink py-2 pl-2 pr-10 whitespace-pre-wrap wrap-anywhere"
            >
                {text}
            </CodeBlock>
        </Stack>
    );
}
