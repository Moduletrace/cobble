import H2 from "@moduletrace/twui/layout/H2";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";

type Props = {
    title: string;
    description: string;
};

/**
 * Heads a run of settings groups on the workspace page (its models).
 */
export default function WorkspaceSectionHeading({ title, description }: Props) {
    return (
        <Stack className="w-full gap-1! pt-10 pb-2 border-0 border-b border-solid border-hairline">
            <H2 className="text-base! leading-6! tracking-normal! font-bold text-ink mb-0!">{title}</H2>
            <Span className="text-[13px] leading-[18px] text-ink-secondary">{description}</Span>
        </Stack>
    );
}
