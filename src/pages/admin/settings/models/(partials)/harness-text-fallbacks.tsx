import type { HarnessOverview, HarnessFormValue } from "@/src/types";
import HarnessFallbackModels from "./harness-fallback-models";

type Props = {
    id: string;
    harness: HarnessOverview;
    value: HarnessFormValue;
    onChange: (value: HarnessFormValue) => void;
};

/**
 * Text harness fallback models list, shown when a text model is selected.
 */
export default function HarnessTextFallbacks({ id, harness, value, onChange }: Props) {
    if (value.inherit || !value.model_id || harness.harness != "text") {
        return null;
    }

    return (
        <HarnessFallbackModels
            id={id}
            models={harness.models}
            model_id={value.model_id}
            fallback_model_ids={value.fallback_model_ids || []}
            onChange={(fallback_model_ids) => onChange({ ...value, fallback_model_ids })}
        />
    );
}
