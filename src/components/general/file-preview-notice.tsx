import P from "@moduletrace/twui/layout/P";
import Stack from "@moduletrace/twui/layout/Stack";

type Props = {
    message: string;
};

/**
 * What the preview says instead of a file it doesn't show.
 */
export default function FilePreviewNotice({ message }: Props) {
    return (
        <Stack className="grow w-full items-center justify-center p-6">
            <P noMargin className="text-sm leading-5 text-ink-secondary text-center max-w-md">
                {message}
            </P>
        </Stack>
    );
}
