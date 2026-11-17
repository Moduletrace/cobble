import type { HarnessFormValue } from "@/src/types";

type Params = {
    /**
     * The current harness form state before the model selection change.
     */
    value: HarnessFormValue;
    /**
     * The new model id selected by the user (null for an automatic pick).
     */
    model_id: number | null;
};

/**
 * Calculates the next harness form value when the picked model changes.
 *
 * Generation settings and voice are specific to the model that was picked:
 * a temperature saved for one model may be a field the next one rejects,
 * and a voice belongs to one provider's model. Both are cleared on every
 * model switch so the new model starts from its own defaults, and only the
 * settings it advertises are offered again.
 */
export default function nextHarnessModelValue({ value, model_id }: Params): HarnessFormValue {
    return {
        ...value,
        model_id,
        params: undefined,
        voice: undefined,
    };
}
