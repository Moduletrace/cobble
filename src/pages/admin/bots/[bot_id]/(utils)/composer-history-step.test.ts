import { describe, expect, test } from "bun:test";
import stepComposerHistory, {
    EmptyComposerHistory,
    type ComposerHistoryState,
} from "./composer-history-step";

/** Presses arrows in turn, collecting what the input took each time. */
function walk({
    texts,
    presses,
    draft = "",
    empty = true,
    state = EmptyComposerHistory,
}: {
    texts: string[];
    presses: ("up" | "down")[];
    draft?: string;
    empty?: boolean;
    state?: ComposerHistoryState;
}) {
    const shown: (string | null)[] = [];
    let current = state;
    let in_input = draft;

    for (const direction of presses) {
        const next = stepComposerHistory({
            state: current,
            texts,
            direction,
            draft: in_input,
            empty,
        });

        shown.push(next ? next.text : null);

        if (next) {
            current = next.state;
            in_input = next.text;
        }

        /** Once a message is in, the input isn't empty any more. */
        empty = false;
    }

    return { shown, state: current, in_input };
}

const texts = ["first", "second", "third"];

describe("stepComposerHistory", () => {
    test("Up on an empty input recalls the newest message", () => {
        const { shown } = walk({ texts, presses: ["up"] });

        expect(shown).toEqual(["third"]);
    });

    test("Up again walks back through older messages", () => {
        const { shown } = walk({ texts, presses: ["up", "up", "up"] });

        expect(shown).toEqual(["third", "second", "first"]);
    });

    test("Up on the oldest message is the editor's; the input stays as it is", () => {
        const { shown, in_input } = walk({ texts, presses: ["up", "up", "up", "up"] });

        expect(shown).toEqual(["third", "second", "first", null]);
        expect(in_input).toEqual("first");
    });

    test("Down comes forward again and then back to what was being typed", () => {
        const { shown, in_input } = walk({
            texts,
            presses: ["up", "up", "down", "down"],
            draft: "half a thought",
        });

        expect(shown).toEqual(["third", "second", "third", "half a thought"]);
        expect(in_input).toEqual("half a thought");
    });

    test("the draft survives walking all the way back and forth", () => {
        const { in_input, state } = walk({
            texts,
            presses: ["up", "up", "up", "down", "down", "down"],
            draft: "an edit",
        });

        expect(in_input).toEqual("an edit");
        expect(state).toEqual(EmptyComposerHistory);
    });

    test("Down on the draft is the editor's", () => {
        const { shown } = walk({ texts, presses: ["down"] });

        expect(shown).toEqual([null]);
    });

    test("Up with text being edited moves the cursor, never replaces the text", () => {
        const { shown } = walk({
            texts,
            presses: ["up"],
            draft: "still typing",
            empty: false,
        });

        expect(shown).toEqual([null]);
    });

    test("Up recalls nothing in a conversation with no earlier message", () => {
        const { shown } = walk({ texts: [], presses: ["up"] });

        expect(shown).toEqual([null]);
    });

    test("recalling the only message and pressing Up again stops there", () => {
        const { shown } = walk({ texts: ["only"], presses: ["up", "up"] });

        expect(shown).toEqual(["only", null]);
    });

    test("a session that holds fewer messages never reads past the oldest", () => {
        const { shown, in_input } = walk({
            texts: ["newest"],
            presses: ["up", "down"],
            state: { index: 3, draft: "my draft" },
        });

        expect(shown).toEqual([null, "my draft"]);
        expect(in_input).toEqual("my draft");
    });

    test("the state it hands back is what the next press starts from", () => {
        const first = stepComposerHistory({
            state: EmptyComposerHistory,
            texts,
            direction: "up",
            draft: "draft",
            empty: true,
        });

        expect(first?.state).toEqual({ index: 1, draft: "draft" });
        expect(first?.text).toEqual("third");
    });
});