import Stack from "@moduletrace/twui/layout/Stack";
import P from "@moduletrace/twui/layout/P";
import NeedsYouChip from "./needs-you-chip";

type Props = {
    text: string;
    needs_you?: boolean;
};

export default function BotMessageLine({ text, needs_you }: Props) {
    return (
        <Stack className="gap-1.5! items-start max-w-full">
            <P noMargin className="text-sm leading-5 text-ink whitespace-pre-wrap break-words">
                {text}
            </P>
            {needs_you ? <NeedsYouChip /> : null}
        </Stack>
    );
}
