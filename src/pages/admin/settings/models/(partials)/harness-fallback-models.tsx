import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { AppData } from "@/src/data/app-data";
import type { HarnessModelOption, HarnessProviderChoice } from "@/src/types";
import HarnessFallbackModelModal from "./harness-fallback-model-modal";
import HarnessFallbackModelRow from "./harness-fallback-model-row";

type Props = {
    id: string;
    /**
     * The providers that have a model for this harness.
     */
    providers: HarnessProviderChoice[];
    /**
     * Every model that can do the job, on any provider.
     */
    models: HarnessModelOption[];
    /**
     * The pick, which can't also be a backup.
     */
    model_id: number;
    fallback_model_ids: number[];
    onChange: (fallback_model_ids: number[]) => void;
};

/**
 * The models tried, in order, when the pick fails or rests, before the
 * automatic free picks: the saved backups, and "Add backup" up to
 * `AppData.HarnessTextFallbackModelsMax`.
 */
export default function HarnessFallbackModels({ id, providers, models, model_id, fallback_model_ids, onChange }: Props) {
    const ids = fallback_model_ids.filter((fallback_id) => fallback_id != model_id);
    const backups = ids.map((backup_id) => {
        const model = models.find((option) => option.id == backup_id);

        return {
            id: backup_id,
            name: model?.name || `Model #${backup_id}`,
            provider_name: model?.provider_name || "No longer offered",
        };
    });
    const full = ids.length >= AppData.HarnessTextFallbackModelsMax;

    return (
        <Stack className="w-full gap-2! items-stretch">
            <Span className="text-[13px] leading-[18px] text-ink-secondary">
                {`When the model above fails or is resting, these are tried in order before the free automatic picks. Add up to ${AppData.HarnessTextFallbackModelsMax}, from any provider.`}
            </Span>
            {backups.map((backup) => (
                <HarnessFallbackModelRow
                    key={backup.id}
                    name={backup.name}
                    provider_name={backup.provider_name}
                    onRemove={() => onChange(ids.filter((other) => other != backup.id))}
                />
            ))}
            <HarnessFallbackModelModal
                id={id}
                providers={providers}
                models={models}
                taken={[model_id, ...ids]}
                disabled={full}
                onAdd={(added) => onChange([...ids, added])}
            />
        </Stack>
    );
}