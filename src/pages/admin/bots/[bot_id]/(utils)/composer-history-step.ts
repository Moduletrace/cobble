/**
 * Where the Up and Down arrows stand in the user's previous messages: 0 is
 * what they were typing, 1 the newest message recalled, 2 the one before it.
 */
export type ComposerHistoryState = {
    index: number;
    /**
     * What was in the input when the newest message was recalled, put back
     * when the arrows come down past it again.
     */
    draft: string;
};

/**
 * The input as the user left it: what they type is theirs, not a message
 * from before.
 */
export const EmptyComposerHistory: ComposerHistoryState = { index: 0, draft: "" };

/**
 * One press of an arrow through the user's previous messages, oldest last:
 * Up recalls the newest from an empty input and older ones from there, Down
 * walks back to the draft. Null when the key is the editor's own (nothing
 * to recall, no older message, or text in the input the user is editing).
 */
export default function stepComposerHistory({
    state,
    texts,
    direction,
    draft,
    empty,
}: {
    state: ComposerHistoryState;
    /** What the user typed before, oldest first. */
    texts: string[];
    direction: "up" | "down";
    /** What's in the input now. */
    draft: string;
    /** Whether the input has nothing in it. */
    empty: boolean;
}): { state: ComposerHistoryState; text: string } | null {
    const count = texts.length;

    if (!state.index) {
        /**
         * Text being edited keeps Up for moving the cursor: only an empty
         * input starts walking back through the messages.
         */
        if (direction == "down" || !empty || !count) return null;

        return { state: { index: 1, draft }, text: texts[count - 1]! };
    }

    /**
     * A session the input followed may hold fewer messages than the one the
     * arrows started in: the oldest one left is as far back as it goes.
     */
    const index = Math.min(state.index, count);

    if (direction == "up") {
        if (index >= count) return null;

        return {
            state: { ...state, index: index + 1 },
            text: texts[count - (index + 1)]!,
        };
    }

    if (index <= 1) return { state: EmptyComposerHistory, text: state.draft };

    return {
        state: { ...state, index: index - 1 },
        text: texts[count - (index - 1)]!,
    };
}