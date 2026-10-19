import SearchSelect from "@moduletrace/twui/form/SearchSelect";
import type { HarnessModelOption } from "@/src/types";
import harnessModelSelectOptions, {
    AutoModelValue,
} from "../(utils)/harness-model-select-options";

type Props = {
    id: string;
    /**
     * Already narrowed to the picked provider.
     */
    models: HarnessModelOption[];
    model_id: number | null;
    provider_name?: string;
    automatic: boolean;
    onChange: (model_id: number | null) => void;
};

/**
 * Searchable model picker: automatic (or not available, for a harness
 * without automatic picks), or any model that can do the job.
 */
export default function HarnessModelSelect({
    id,
    models,
    model_id,
    provider_name,
    automatic,
    onChange,
}: Props) {
    return (
        <SearchSelect
            id={id}
            title="Model"
            label="Model"
            showLabel
            placeholder="Search models"
            options={harnessModelSelectOptions({ models, model_id, provider_name, automatic })}
            defaultValues={[model_id ? String(model_id) : AutoModelValue]}
            changeHandler={(value) => {
                const picked = Array.isArray(value) ? value[0] : value;

                onChange(!picked || picked == AutoModelValue ? null : Number(picked));
            }}
        />
    );
}
