import Span from "@moduletrace/twui/layout/Span";
import type { HarnessModelOption } from "@/src/types";

type Props = {
    model?: HarnessModelOption;
};

/**
 * A word when the picked text model's capabilities were guessed: only
 * OpenRouter's catalog says what a model takes, so every other provider is
 * listed by id and read from its name (`guessModelModalities`), which always
 * answers that it calls tools. Said out loud because a vision model was
 * pinned this way as a worker's text model and answered every reply as prose
 * that never closed with `send_reply`: the run failed, and nothing on the
 * page said the model was never a tool-caller.
 */
export default function HarnessGuessedModelNote({ model }: Props) {
    if (!model?.capabilities_guessed) return null;

    return (
        <Span className="text-[13px] leading-[18px] text-ink-secondary">
            {`${model.provider_name} lists model ids only, so ${model.name}'s capabilities are guessed from its name: nothing here can tell that it takes images, or that it never calls tools. A model that can't drive a run fails quietly (answers that end as drafts, reports that never close), so watch its first runs and unpin it if the bot stops calling tools. OpenRouter is the one provider whose catalog says what each model takes.`}
        </Span>
    );
}
