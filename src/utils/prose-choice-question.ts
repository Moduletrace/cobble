/**
 * A choice the model wrote into its answer instead of on an `ask_user`
 * card: a question asking the user to pick, with a list of options under
 * it. Only the shape matters here; the review decides whether a card was
 * actually made.
 */
type ProseChoiceQuestion = {
    /**
     * The question line, without markdown emphasis.
     */
    question: string;
    /**
     * How many options the list offered.
     */
    options: number;
};

type Params = {
    text: string;
};

/**
 * A line that asks the user to choose, rather than one that heads a section
 * ("What's included?" over a list of facts).
 */
const ChoiceCue = /\b(which|would you like|want me to|should i|shall i|do you want(?: me)? to|choose|pick|prefer|option)\b/i;

/**
 * The cues that make a line ending in ":" an offer rather than a heading.
 * "Want me to:" heads the choices in a bot's answer and carries no question
 * mark, so the question-mark test alone missed it (session 135's last
 * message offered two next steps that way). A colon after "Options" or
 * "Which files I read" is a heading over facts, so only an offer counts.
 */
const OfferCue = /\b(would you like|want me to|should i|shall i|do you want(?: me)? to)\b/i;

const ListItem = /^\s*(?:[-*+]|\d{1,2}[.)])\s+\S/;
const Fence = /^\s*(?:```|~~~)/;

/**
 * Finds the answer's closing choice, written as prose: the last question
 * that asks the user to pick, with at least two list items directly under
 * it. A reply that ends this way with no `ask_user` call makes the user
 * retype an option instead of clicking one; session 133 shipped two of
 * them ("What would you like to do?" with three numbered choices, and
 * "Which would you like?" with Option A and B), and session 135's "Want me
 * to:" with two bullets.
 *
 * The list must follow the question in the same block, and the question
 * must carry a choice cue, so "Want me to send it?" with no list, or a
 * heading over a table of facts, is left alone. Fenced code is never read
 * as an ask.
 */
export default function proseChoiceQuestion({ text }: Params): ProseChoiceQuestion | null {
    const lines = text.split("\n");
    let in_fence = false;

    for (let index = lines.length - 1; index >= 0; index -= 1) {
        const line = lines[index]!;

        if (Fence.test(line)) {
            in_fence = !in_fence;
            continue;
        }

        if (in_fence) continue;

        const plain = line.replace(/\*\*|__/g, "").trim();
        const asks = plain.includes("?") || (plain.endsWith(":") && OfferCue.test(plain));

        if (!asks || !ChoiceCue.test(plain)) continue;

        const question = plain;
        let options = 0;

        for (let next = index + 1; next < lines.length && next <= index + 16; next += 1) {
            const item = lines[next]!;

            if (Fence.test(item)) break;
            if (!item.trim()) continue;
            if (item.trim() == "---") break;
            if (!ListItem.test(item)) break;

            options += 1;
        }

        if (options >= 2) return { question, options };
    }

    return null;
}