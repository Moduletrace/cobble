import P from "@moduletrace/twui/layout/P";
import Stack from "@moduletrace/twui/layout/Stack";
import {
    HarnessParameters,
    type HarnessParameterKey,
} from "@/src/dict/harness-parameter-dict";
import HarnessProviderParameterCheckbox from "./harness-provider-parameter-checkbox";

type Props = {
    parameters: HarnessParameterKey[];
    onChange: (parameters: HarnessParameterKey[]) => void;
};

/**
 * The generation settings a provider's models are offered, for the models
 * whose own list carries none (a custom provider lists ids only).
 */
export default function HarnessProviderParameters({
    parameters,
    onChange,
}: Props) {
    return (
        <Stack className="gap-2! items-stretch">
            <P className="text-sm text-ink-secondary">
                The generation settings its models are offered, for the models
                whose own list carries none (a custom provider lists ids only).
                Models that list their own (OpenRouter) keep theirs. A provider
                that takes none unticks all of them, so no field it would refuse
                is ever sent.
            </P>
            {HarnessParameters.map((parameter) => (
                <HarnessProviderParameterCheckbox
                    key={parameter.key}
                    parameter={parameter}
                    checked={parameters.includes(parameter.key)}
                    onChange={(checked) =>
                        onChange(
                            checked
                                ? [...parameters, parameter.key]
                                : parameters.filter((key) => key != parameter.key),
                        )
                    }
                />
            ))}
        </Stack>
    );
}