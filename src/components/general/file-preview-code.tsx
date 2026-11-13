import Stack from "@moduletrace/twui/layout/Stack";
import SunkenCodeBlock from "./sunken-code-block";

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
            <SunkenCodeBlock wrapAnywhere>{text}</SunkenCodeBlock>
        </Stack>
    );
}