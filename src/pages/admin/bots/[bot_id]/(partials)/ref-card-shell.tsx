import type { ReactNode } from "react";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import Tag from "@moduletrace/twui/elements/Tag";

type Props = {
    icon: ReactNode;
    title: string;
    status: string;
    tone: "success" | "warning" | "gray";
    description?: string;
    children: ReactNode;
};

/**
 * The frame every card a bot puts up in the conversation shares (a plan's
 * steps, its questions, a proposal, a secret request): a header naming it
 * and where it stands, then the card itself. The header is built from
 * spans and rows so the whole card reads as one block in the message, the
 * way the plan card does, instead of a chip that hides it behind a modal.
 */
export default function RefCardShell({ icon, title, status, tone, description, children }: Props) {
    return (
        <Stack className="my-1 w-full gap-0! items-stretch overflow-hidden rounded-default border border-solid border-hairline bg-paper">
            <Row className="w-full flex-nowrap items-center gap-2 border-0 border-b border-solid border-hairline bg-surface py-1.5 pr-2 pl-3">
                <Span className="shrink-0 text-ink-secondary">{icon}</Span>
                <Span className="min-w-0 grow truncate text-sm font-bold text-ink">{title}</Span>
                <Tag color={tone} className="shrink-0">
                    {status}
                </Tag>
            </Row>
            <Stack className="w-full gap-2! items-stretch p-3">
                {description ? (
                    <Span className="text-[13px] leading-[18px] text-ink-secondary">{description}</Span>
                ) : null}
                {children}
            </Stack>
        </Stack>
    );
}