import Span from "@moduletrace/twui/layout/Span";
import useBotSuggestion from "../(hooks)/use-bot-suggestion";
import BotSuggestionChip from "./bot-suggestion-chip";

type Props = {
    suggestion_id: number;
};

/**
 * Next steps a bot suggested (`botSuggestionRef`): its heading and a
 * button per step, inline under the answer. Clicking one puts it in the
 * user's input; nothing has to be answered. Anyone they weren't suggested
 * to sees their number only.
 */
export default function BotSuggestionsRef({ suggestion_id }: Props) {
    const { view, loading } = useBotSuggestion({ suggestion_id });

    if (!view) {
        return (
            <Span className="font-bold">
                {loading ? `next steps ${suggestion_id}` : `next steps ${suggestion_id} (not available)`}
            </Span>
        );
    }

    if (!view.steps.length) return null;

    return (
        <Span className="inline-flex max-w-full flex-wrap items-center gap-1.5 align-middle">
            <Span className="text-[13px] font-bold text-ink-secondary">{view.title || "Next steps"}</Span>
            {view.steps.map((step) => (
                <BotSuggestionChip key={step} step={step} />
            ))}
        </Span>
    );
}