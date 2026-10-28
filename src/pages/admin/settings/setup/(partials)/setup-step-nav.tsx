import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { AdminHomePath } from "@/src/dict/admin-sections-dict";

type Props = {
    is_first: boolean;
    is_last: boolean;
    onBack: () => void;
    onNext: () => void;
};

/**
 * Under each step: skip the whole setup, go back, or go on. The last step
 * goes to the bots.
 */
export default function SetupStepNav({ is_first, is_last, onBack, onNext }: Props) {
    return (
        <Row className="w-full gap-2! items-center justify-between py-6">
            {is_last ? (
                <Row />
            ) : (
                <Button
                    title="Skip the setup"
                    type="button"
                    variant="ghost"
                    color="gray"
                    size="small"
                    href={AdminHomePath}
                >
                    Skip setup
                </Button>
            )}
            <Row className="gap-2! ml-auto">
                {is_first ? null : (
                    <Button
                        title="Back"
                        type="button"
                        variant="outlined"
                        color="gray"
                        size="small"
                        beforeIcon={<ArrowLeft size={14} aria-hidden />}
                        onClick={onBack}
                    >
                        Back
                    </Button>
                )}
                {is_last ? (
                    <Button
                        title="Go to your bots"
                        type="button"
                        size="small"
                        href={AdminHomePath}
                        afterIcon={<ArrowRight size={14} aria-hidden />}
                    >
                        Start chatting
                    </Button>
                ) : (
                    <Button
                        title="Next step"
                        type="button"
                        size="small"
                        afterIcon={<ArrowRight size={14} aria-hidden />}
                        onClick={onNext}
                    >
                        Next
                    </Button>
                )}
            </Row>
        </Row>
    );
}
