import type { ReactNode } from "react";
import Modal from "@moduletrace/twui/elements/Modal";
import H2 from "@moduletrace/twui/layout/H2";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import TopModalEscape from "@/src/components/general/top-modal-escape";

type Props = {
    open: boolean;
    setOpen: (open: boolean) => void;
    title: string;
    description?: string;
    /**
     * A picture beside the title, e.g. the app an account signs in to.
     */
    icon?: ReactNode;
    children: ReactNode;
};

/**
 * The frame every Add modal shares: a title, one line on what it does, the
 * content.
 */
export default function AddModalShell({ open, setOpen, title, description, icon, children }: Props) {
    return (
        <Modal
            open={open}
            setOpen={(next) => setOpen(typeof next == "function" ? next(open) : next)}
            className="max-w-lg bg-paper p-6"
        >
            {open ? <TopModalEscape onClose={() => setOpen(false)} /> : null}
            <Row className="w-full items-center gap-3! flex-nowrap">
                {icon}
                <Stack className="w-full gap-1! items-stretch">
                    <H2 className="text-lg! leading-6! tracking-normal! font-bold text-ink">{title}</H2>
                    {description ? (
                        <Span className="text-[13px] leading-[18px] text-ink-secondary">{description}</Span>
                    ) : null}
                </Stack>
            </Row>
            {children}
        </Modal>
    );
}