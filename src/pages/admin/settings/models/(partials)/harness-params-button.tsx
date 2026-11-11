import { HarnessParameterHarnesses } from "@/src/dict/harness-parameter-dict";
import type { HarnessKind } from "@/src/dict/harness-dict";
import type { HarnessModelOption } from "@/src/types";
import HarnessParameterModal from "./harness-parameter-modal";

type Props = {
    id: string;
    harness: HarnessKind;
    inherit?: boolean;
    model?: HarnessModelOption | null;
    params?: Record<string, number | string>;
    onChange: (params: Record<string, number | string>) => void;
};

/**
 * Parameter modal trigger for harnesses supporting generation settings.
 */
export default function HarnessParamsButton({
    id,
    harness,
    inherit,
    model,
    params,
    onChange,
}: Props) {
    const is_supported = HarnessParameterHarnesses.includes(
        harness as (typeof HarnessParameterHarnesses)[number],
    );

    if (inherit || !is_supported || !model) {
        return null;
    }

    return (
        <HarnessParameterModal
            id={id}
            harness={harness}
            model={model}
            params={params}
            onChange={onChange}
        />
    );
}
