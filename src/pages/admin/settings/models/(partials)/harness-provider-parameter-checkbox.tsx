import Checkbox from "@moduletrace/twui/form/Checkbox";
import type { HarnessParameter } from "@/src/dict/harness-parameter-dict";

type Props = {
    parameter: HarnessParameter;
    checked: boolean;
    onChange: (checked: boolean) => void;
};

/**
 * One generation setting a provider's models are offered.
 */
export default function HarnessProviderParameterCheckbox({
    parameter,
    checked,
    onChange,
}: Props) {
    return (
        <Checkbox
            title={parameter.title}
            label={parameter.title}
            info={parameter.description}
            checked={checked}
            clickDispatchHandler={onChange}
        />
    );
}