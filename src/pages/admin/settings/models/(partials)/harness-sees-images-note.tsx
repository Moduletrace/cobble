import Span from "@moduletrace/twui/layout/Span";
import type { HarnessModelOption } from "@/src/types";

type Props = {
    model?: HarnessModelOption;
};

/**
 * A word when the text setting says the model reads its own media but the
 * catalog has it as text only, so nothing would be read by it: it's a
 * silencer otherwise (`qwen3.8-flash` on a provider that lists bare ids is
 * guessed text only, and every reply paid for a media reading call).
 */
export default function HarnessSeesImagesNote({ model }: Props) {
    if (!model || model.input_modalities?.includes("image")) return null;

    return (
        <Span className="text-[13px] leading-[18px] text-ink-secondary">
            {`${model.name} is listed as taking text only, so the media reading model still reads images for it. Set the text model to one that takes images to use this.`}
        </Span>
    );
}
