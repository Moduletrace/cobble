import Row from "@moduletrace/twui/layout/Row";
import Stack from "@moduletrace/twui/layout/Stack";
import H1 from "@moduletrace/twui/layout/H1";
import Span from "@moduletrace/twui/layout/Span";

type Props = {
    title: string;
    description: string;
};

/**
 * Same 64px header as a conversation, so moving between bots and settings
 * doesn't shift the page.
 */
export default function SettingsPaneHeader({ title, description }: Props) {
    return (
        <Row className="h-16 shrink-0 gap-3! flex-nowrap items-center px-6 border-0 border-b border-solid border-hairline">
            <Stack className="min-w-0 gap-0!">
                <H1 className="text-lg! leading-6! tracking-normal! font-bold text-ink truncate">
                    {title}
                </H1>
                <Span className="text-[13px] leading-[18px] text-ink-secondary truncate">
                    {description}
                </Span>
            </Stack>
        </Row>
    );
}
