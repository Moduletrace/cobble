import type { ReactNode } from "react";
import Row from "@moduletrace/twui/layout/Row";
import Stack from "@moduletrace/twui/layout/Stack";
import H1 from "@moduletrace/twui/layout/H1";
import Span from "@moduletrace/twui/layout/Span";

type Props = {
    title: string;
    description: string;
    /**
     * Controls at the end of the header, e.g. a settings link.
     */
    action?: ReactNode;
};

/**
 * Same 64px header as a conversation, so moving between bots and settings
 * doesn't shift the page.
 */
export default function SettingsPaneHeader({
    title,
    description,
    action,
}: Props) {
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
            {action ? (
                <Row className="ml-auto shrink-0 gap-1! flex-nowrap justify-end">
                    {action}
                </Row>
            ) : null}
        </Row>
    );
}
