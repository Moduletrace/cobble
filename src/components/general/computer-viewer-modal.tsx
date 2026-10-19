import type { ReactNode } from "react";
import Modal from "@moduletrace/twui/elements/Modal";
import H2 from "@moduletrace/twui/layout/H2";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import type { ComputerViewMode } from "@/src/dict/computer-dict";
import ComputerView from "./computer-view";

type Props = {
    open: boolean;
    onClose: () => void;
    computer_id: number;
    /**
     * The computer's name, in the header and the frame titles.
     */
    name: string;
    /**
     * The mode it opens in.
     */
    default_mode?: ComputerViewMode;
    /**
     * A line under the name, e.g. a take-over note.
     */
    note?: string;
    /**
     * Controls at the end of the header, e.g. handing it back.
     */
    action?: ReactNode;
};

/**
 * A computer, large, in its browser, terminal or code editor, over the
 * page. `ComputerOpenButton` opens it from lists; chat's viewer adds a
 * note and the hand-back action after a take-over.
 */
export default function ComputerViewerModal({
    open,
    onClose,
    computer_id,
    name,
    default_mode,
    note,
    action,
}: Props) {
    if (!open) return null;

    return (
        <Modal
            open
            setOpen={(next_open) => {
                if (!next_open) onClose();
            }}
            className="max-w-[95vw]! h-[90vh] p-0 bg-paper flex flex-col overflow-hidden"
        >
            <Row className="w-full gap-3! flex-nowrap items-center pl-5 pr-14 py-3 border-0 border-b border-solid border-hairline">
                <Stack className="min-w-0 gap-0! items-start">
                    <H2 className="text-base! leading-6! tracking-normal! font-bold text-ink truncate w-full">
                        {name}
                    </H2>
                    {note ? (
                        <Span className="text-[13px] leading-[18px] text-ink-secondary">
                            {note}
                        </Span>
                    ) : null}
                </Stack>
                {action ? (
                    <Stack className="ml-auto shrink-0 gap-1! items-end">
                        {action}
                    </Stack>
                ) : null}
            </Row>
            <ComputerView
                key={`${computer_id}-${default_mode}`}
                computer_id={computer_id}
                name={name}
                default_mode={default_mode}
                className="grow"
            />
        </Modal>
    );
}
