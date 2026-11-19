import type { ReactNode } from "react";
import Modal from "@moduletrace/twui/elements/Modal";
import Span from "@moduletrace/twui/layout/Span";

type Props = {
    trigger: ReactNode;
    open: boolean;
    onClose: () => void;
    className?: string;
    children: ReactNode;
};

/**
 * A ref chip's trigger and the card it opens (`[question:ID]`,
 * `[proposal:ID]`, ...). The chip sits in a markdown paragraph, which takes
 * phrasing content only: the trigger is a span around the caller's button,
 * and the card is mounted only while open, since twui's own `target`
 * wrapper is a div and a div inside the paragraph is invalid (React says
 * so in the console).
 */
export default function RefChipModal({ trigger, open, onClose, className, children }: Props) {
    return (
        <>
            <Span className="inline-flex max-w-full align-middle">{trigger}</Span>
            {open ? (
                <Modal
                    open
                    setOpen={(next_open) => {
                        if (!next_open) onClose();
                    }}
                    className={className}
                >
                    {children}
                </Modal>
            ) : null}
        </>
    );
}