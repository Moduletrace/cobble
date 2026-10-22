import type { ReactNode } from "react";
import Row from "@moduletrace/twui/layout/Row";
import Stack from "@moduletrace/twui/layout/Stack";
import H1 from "@moduletrace/twui/layout/H1";
import Span from "@moduletrace/twui/layout/Span";
import RailDrawerButton from "@/src/layouts/bots/(partials)/rail-drawer-button";
import BackButton from "@/src/components/general/back-button";
import { twMerge } from "tailwind-merge";

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
 * doesn't shift the page. Below `md` it also holds the rail's drawer
 * button, since the rail is out of the layout there.
 */
export default function SettingsPaneHeader({
    title,
    description,
    action,
}: Props) {
    return (
        <Row
            className={twMerge(
                "h-16 shrink-0 gap-2! md:gap-3! flex-nowrap items-center px-3",
                "md:px-6 border-0 border-b border-solid border-hairline",
            )}
        >
            <RailDrawerButton />
            <BackButton />
            <Stack className="min-w-0 gap-0!">
                <H1
                    className={twMerge(
                        "text-lg! leading-6! tracking-normal! font-bold text-ink truncate line-clamp-1",
                        "whitespace-nowrap w-full",
                    )}
                >
                    {title}
                </H1>
                <Span
                    className={twMerge(
                        "text-[13px] leading-[18px] text-ink-secondary truncate",
                        "line-clamp-1 whitespace-nowrap w-full",
                    )}
                >
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
