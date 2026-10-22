import Input from "@moduletrace/twui/form/Input";
import Select from "@moduletrace/twui/form/Select";
import type { HarnessParameter } from "@/src/dict/harness-parameter-dict";
import type { HarnessParameterValue } from "@/src/dict/harness-parameter-dict";

export const DefaultParameterValue = "default";

type Props = {
    id: string;
    parameter: HarnessParameter;
    value?: HarnessParameterValue;
    onChange: (value: HarnessParameterValue | undefined) => void;
};

/**
 * One generation setting: a number field (empty for the provider's
 * default) or a pick from fixed choices ("Default" for the provider's).
 */
export default function HarnessParameterControl({
    id,
    parameter,
    value,
    onChange,
}: Props) {
    if (parameter.value_type == "select") {
        return (
            <Select
                id={id}
                title={parameter.title}
                label={parameter.title}
                showLabel
                info={parameter.description}
                value={value ? String(value) : DefaultParameterValue}
                options={[
                    {
                        value: DefaultParameterValue,
                        title: "Default (the model's own)",
                    },
                    ...parameter.options.map((option) => ({
                        value: option.value,
                        title: option.title,
                    })),
                ]}
                changeHandler={(picked) =>
                    onChange(
                        picked == DefaultParameterValue ? undefined : picked,
                    )
                }
            />
        );
    }

    return (
        <Input
            id={id}
            title={parameter.title}
            label={parameter.title}
            showLabel
            info={parameter.description}
            numberText
            min={parameter.min}
            max={"max" in parameter ? parameter.max : undefined}
            step={parameter.step}
            defaultValue={value === undefined ? "" : String(value)}
            placeholder="Default"
            changeHandler={(next) => {
                if (next.trim() == "") {
                    onChange(undefined);
                    return;
                }

                const number = Number(next);

                if (!Number.isNaN(number)) onChange(number);
            }}
        />
    );
}
