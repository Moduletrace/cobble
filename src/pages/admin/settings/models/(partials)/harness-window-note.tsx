import Span from "@moduletrace/twui/layout/Span";
import { AppData } from "@/src/data/app-data";
import workingContextTokens from "@/src/harness/text/working-context";
import type { HarnessModelOption } from "@/src/types";

type Props = {
    model?: HarnessModelOption;
};

/**
 * A word when the text model never declared a window: a run assumes
 * `AppData.HarnessUnknownContextWindow` and works to that less the room its
 * answer needs. Said out loud because the app used to size runs at 70% of a
 * guessed 131,072 without a word, which left one chat 91,750 tokens of
 * working context and then reading nothing at all (`workingContextTokens`).
 */
export default function HarnessWindowNote({ model }: Props) {
    if (!model || model.context_length) return null;

    const working = workingContextTokens({});

    return (
        <Span className="text-[13px] leading-[18px] text-ink-secondary">
            {`${model.name} declares no context window, so a run assumes ${AppData.HarnessUnknownContextWindow.toLocaleString("en-US")} tokens and works to ${working.tokens.toLocaleString("en-US")} of them, keeping the rest for its answer. A model smaller than that refuses the prompt and stops the run with its own limit: set the window on its provider, or pick a model that declares one.`}
        </Span>
    );
}