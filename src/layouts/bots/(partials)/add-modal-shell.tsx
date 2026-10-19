import type { ReactNode } from "react";
import Modal from "@moduletrace/twui/elements/Modal";
import H2 from "@moduletrace/twui/layout/H2";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";

type Props = {
    open: boolean;
    setOpen: (open: boolean) => void;
    title: string;
    description?: string;
    children: ReactNode;
};

/**
 * The frame every Add modal shares: a title, one line on what it does, the
 * content.
 */
export default function AddModalShell({ open, setOpen, title, description, children }: Props) {
    return (
        <Modal
            open={open}
            setOpen={(next) => setOpen(typeof next == "function" ? next(open) : next)}
            className="max-w-lg bg-paper p-6"
        >
            <Stack className="w-full gap-1! items-stretch">
                <H2 className="text-lg! leading-6! tracking-normal! font-bold text-ink">{title}</H2>
                {description ? (
                    <Span className="text-[13px] leading-[18px] text-ink-secondary">{description}</Span>
                ) : null}
            </Stack>
            {children}
        </Modal>
    );
}
