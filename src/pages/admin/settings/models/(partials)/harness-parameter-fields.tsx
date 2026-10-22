import {
    HarnessParameters,
    modelTakesParameter,
} from "@/src/dict/harness-parameter-dict";
import type { HarnessModelOption } from "@/src/types";
import HarnessParameterControl from "./harness-parameter-control";

type Props = {
    id: string;
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
 * lists no parameters (anything but OpenRouter) gets them all.
 */
export default function HarnessParameterFields({
    id,
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
                    value={params?.[parameter.key]}
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
