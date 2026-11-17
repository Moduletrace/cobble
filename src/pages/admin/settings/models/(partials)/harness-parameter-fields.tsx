import {
    HarnessParameterHarnesses,
    harnessParameterValue,
    HarnessParameters,
    modelAdvertisesParameter,
    type HarnessParameterKey,
} from "@/src/dict/harness-parameter-dict";
import type { HarnessKind } from "@/src/dict/harness-dict";
import type { HarnessModelOption } from "@/src/types";
import HarnessParameterControl from "./harness-parameter-control";

type Props = {
    id: string;
    /**
     * The harness the settings are for: its default fills an empty one.
     */
    harness: HarnessKind;
    /**
     * The model whose settings these are: only what it takes is shown.
     */
    model?: HarnessModelOption;
    params?: Record<string, number | string>;
    onChange: (params: Record<string, number | string>) => void;
};

/**
 * The generation settings the picked model takes: temperature, sampling
 * limits, penalties, seed and reasoning effort. Only what the model's
 * provider advertises is offered; a model whose provider lists nothing
 * (a custom provider) gets no fields at all. An empty one shows the value
 * it actually runs on (the harness's default), which is only sent when
 * the model advertises the field.
 */
export default function HarnessParameterFields({
    id,
    harness,
    model,
    params,
    onChange,
}: Props) {
    const shown = HarnessParameters.filter((parameter) =>
        model
            ? modelAdvertisesParameter({
                  parameter,
                  supported: model.supported_parameters,
              })
            : false,
    );

    return (
        <>
            {shown.map((parameter) => (
                <HarnessParameterControl
                    key={parameter.key}
                    id={`${id}-${parameter.key}`}
                    parameter={parameter}
                    value={
                        harnessParameterValue({
                            harness: harness as (typeof HarnessParameterHarnesses)[number],
                            params,
                            key: parameter.key,
                        }).value
                    }
                    onChange={(value) => {
                        const next = { ...params };

                        if (value === undefined) delete next[parameter.key];
                        else next[parameter.key] = value;

                        onChange(next);
                    }}
                />
            ))}
        </>
    );
}
