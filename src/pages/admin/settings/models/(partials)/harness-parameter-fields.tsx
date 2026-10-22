import {
    HarnessParameterHarnesses,
    harnessParameterValue,
    HarnessParameters,
    modelTakesParameter,
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
 * limits, penalties, seed and reasoning effort. A model whose provider
 * lists no parameters (anything but OpenRouter) gets them all. An empty
 * one shows the value it actually runs on (the harness's default). A model
 * whose provider lists nothing gets the app's default in its box, but the
 * call only sends a default to a model that advertises the field.
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
            ? modelTakesParameter({
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
