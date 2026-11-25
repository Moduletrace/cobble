import Span from "@moduletrace/twui/layout/Span";
import type { HarnessModelOption } from "@/src/types";

type Props = {
    /**
     * The model the Image setting uses now.
     */
    model?: HarnessModelOption;
    /**
     * Image editing's current model: where a call with a reference goes while
     * the image pick can't take one.
     */
    reference_model?: HarnessModelOption;
};

/**
 * A word on a model that can't take a reference image: every call that passes
 * one goes to Image editing instead, so the pick isn't the model that answers.
 * Recraft was picked a minute before a run spent 29 minutes on the old qwen
 * edit pick, and nothing on this page said so.
 */
export default function HarnessReferenceModelNote({ model, reference_model }: Props) {
    if (!model || model.input_modalities?.includes("image")) return null;

    return (
        <Span className="text-[13px] leading-[18px] text-ink-secondary">
            {reference_model
                ? `${model.name} can't take reference images, so a request with one (recreating or reworking an image) uses Image editing's model, ${reference_model.name}.`
                : `${model.name} can't take reference images, so a request with one needs a model picked under Image editing.`}
        </Span>
    );
}