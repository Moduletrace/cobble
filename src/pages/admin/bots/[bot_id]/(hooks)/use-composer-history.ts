import { useRef } from "react";
import stepComposerHistory, {
    EmptyComposerHistory,
    type ComposerHistoryState,
} from "../(utils)/composer-history-step";

/**
 * The user's previous messages, walked with the Up and Down arrows: what
 * they were typing is kept and comes back when Down passes the newest
 * message again.
 */
export type ComposerHistory = {
    /** A recalled message is in the input (so the arrows keep walking). */
    isActive: () => boolean;
    /**
     * One arrow press: the text the input takes, or null when the key
     * belongs to the editor (a cursor to move, nothing to recall).
     */
    step: (params: {
        direction: "up" | "down";
        /** What's in the input now, put back on the way down. */
        draft: string;
        /** Whether the input has nothing in it. */
        empty: boolean;
    }) => { text: string } | null;
    /** Typing (or sending) takes the input back from the recalled messages. */
    reset: () => void;
};

export default function useComposerHistory({
    texts,
}: {
    /** What the user typed before, oldest first. */
    texts: string[];
}): ComposerHistory {
    const state = useRef<ComposerHistoryState>(EmptyComposerHistory);
    const texts_ref = useRef(texts);

    texts_ref.current = texts;

    const reset = () => {
        state.current = EmptyComposerHistory;
    };

    const step = ({
        direction,
        draft,
        empty,
    }: {
        direction: "up" | "down";
        draft: string;
        empty: boolean;
    }) => {
        const next = stepComposerHistory({
            state: state.current,
            texts: texts_ref.current,
            direction,
            draft,
            empty,
        });

        if (!next) return null;

        state.current = next.state;

        return { text: next.text };
    };

    return { isActive: () => state.current.index > 0, step, reset };
}