import Row from "@moduletrace/twui/layout/Row";
import { SetupSteps } from "../(data)/setup-steps";
import SetupStepItem from "./setup-step-item";

type Props = {
    index: number;
    onSelect: (index: number) => void;
};

/**
 * Where the setup is: every step, the current one marked.
 */
export default function SetupStepsTrail({ index, onSelect }: Props) {
    return (
        <Row
            aria-label="Setup steps"
            className="w-full gap-1! md:gap-2! pt-6 pb-2 border-0 border-b border-solid border-hairline"
        >
            {SetupSteps.map((step, i) => (
                <SetupStepItem
                    key={step.key}
                    title={step.title}
                    number={i + 1}
                    current={i == index}
                    done={i < index}
                    onSelect={() => onSelect(i)}
                />
            ))}
        </Row>
    );
}
