import H2 from "@moduletrace/twui/layout/H2";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";

type Props = {
    title: string;
    description: string;
    /**
     * An anchor, so the rail can link to this section.
     */
    id?: string;
};

/**
 * Heads a run of settings groups, e.g. the models form on a bot or
 * workspace page.
 */
export default function SettingsSectionHeading({
    title,
    description,
    id,
}: Props) {
    return (
        <Stack
            id={id}
            className="w-full scroll-mt-4 gap-1! pt-10 pb-2 border-0 border-b border-solid border-hairline"
        >
            <H2 className="text-base! leading-6! tracking-normal! font-bold text-ink mb-0!">
                {title}
            </H2>
            <Span className="text-[13px] leading-[18px] text-ink-secondary">
                {description}
            </Span>
        </Stack>
    );
}
