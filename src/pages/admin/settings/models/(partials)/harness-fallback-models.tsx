import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { AppData } from "@/src/data/app-data";
import type { HarnessModelOption } from "@/src/types";
import HarnessFallbackModelSelect from "./harness-fallback-model-select";

type Props = {
    id: string;
    /**
     * Every model that can do the job, on any provider.
     */
    models: HarnessModelOption[];
    /**
     * The pick, which can't also be a fallback.
     */
    model_id: number;
    fallback_model_ids: number[];
    onChange: (fallback_model_ids: number[]) => void;
};

/**
 * The models tried, in order, when the pick fails or rests, before the
 * automatic free picks: the filled slots plus one empty one, up to
 * `AppData.HarnessTextFallbackModelsMax`. Clearing a slot closes the gap.
 */
export default function HarnessFallbackModels({ id, models, model_id, fallback_model_ids, onChange }: Props) {
    const ids = fallback_model_ids.filter((fallback_id) => fallback_id != model_id);
    const slots: (number | undefined)[] =
        ids.length < AppData.HarnessTextFallbackModelsMax ? [...ids, undefined] : ids;

    const change = ({ index, model_id: picked }: { index: number; model_id: number | null }) => {
        const next: (number | null)[] = [...ids];

        next[index] = picked;
        onChange(next.filter((value): value is number => Boolean(value)));
    };

    return (
        <Stack className="w-full gap-2! items-stretch">
            <Span className="text-[13px] leading-[18px] text-ink-secondary">
                {`When the model above fails or is resting, these are tried in order before the free automatic picks. Pick up to ${AppData.HarnessTextFallbackModelsMax}, from any provider.`}
            </Span>
            {slots.map((slot, index) => (
                <HarnessFallbackModelSelect
                    key={`${index}-${slot ?? "none"}-${ids.join(",")}`}
                    id={`${id}-fallback`}
                    index={index}
                    models={models}
                    model_id={slot}
                    taken={[model_id, ...ids.filter((_, other) => other != index)]}
                    onChange={change}
                />
            ))}
        </Stack>
    );
}
