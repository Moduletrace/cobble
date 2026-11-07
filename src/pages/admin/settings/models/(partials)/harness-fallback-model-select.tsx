import SearchSelect from "@moduletrace/twui/form/SearchSelect";
import type { HarnessModelOption } from "@/src/types";
import harnessFallbackModelOptions, { NoFallbackValue } from "../(utils)/harness-fallback-model-options";

type Props = {
    id: string;
    /**
     * 0-based place in the fallback order.
     */
    index: number;
    models: HarnessModelOption[];
    model_id?: number;
    taken: number[];
    onChange: (params: { index: number; model_id: number | null }) => void;
};

/**
 * One fallback model slot: a searchable pick from every provider, or none.
 */
export default function HarnessFallbackModelSelect({ id, index, models, model_id, taken, onChange }: Props) {
    return (
        <SearchSelect
            id={`${id}-${index}`}
            title={`Fallback model ${index + 1}`}
            label={`Fallback model ${index + 1}`}
            showLabel
            placeholder="Search models"
            options={harnessFallbackModelOptions({ models, model_id, taken })}
            defaultValues={[model_id ? String(model_id) : NoFallbackValue]}
            changeHandler={(value) => {
                const picked = Array.isArray(value) ? value[0] : value;

                onChange({ index, model_id: !picked || picked == NoFallbackValue ? null : Number(picked) });
            }}
        />
    );
}
