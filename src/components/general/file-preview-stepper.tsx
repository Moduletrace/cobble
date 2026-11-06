import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import { ChevronLeft, ChevronRight } from "lucide-react";
import RowIconButton from "./row-icon-button";

type Props = {
    /**
     * The shown file's place in the gallery, from 0.
     */
    index: number;
    count: number;
    onPrevious: () => void;
    onNext: () => void;
};

/**
 * Previous and Next through a preview's gallery (the images of a folder or
 * a message), with where the shown one stands: "3 of 12". The arrow keys
 * do the same.
 */
export default function FilePreviewStepper({ index, count, onPrevious, onNext }: Props) {
    return (
        <Row className="shrink-0 gap-0! flex-nowrap items-center">
            <RowIconButton
                icon={ChevronLeft}
                title="Previous image (Left arrow)"
                disabled={index <= 0}
                onClick={onPrevious}
            />
            <Span className="min-w-16 text-center text-[13px] leading-[18px] tabular-nums text-ink-secondary">
                {`${index + 1} of ${count}`}
            </Span>
            <RowIconButton
                icon={ChevronRight}
                title="Next image (Right arrow)"
                disabled={index >= count - 1}
                onClick={onNext}
            />
        </Row>
    );
}
