type Params = {
    text: string;
};

type Stripped = {
    text: string;
    /**
     * Whether anything was taken out, so the caller can say where the
     * question is waiting instead.
     */
    removed: boolean;
};

/**
 * A bot's question card, as its message names it (`[question:12]`).
 */
const QuestionRef = /\[question:\d+\]/;

/**
 * A ref between words leaves one space behind, never two: `[ \t]*` around it
 * stays on the same line, so paragraph breaks survive.
 */
const QuestionRefs = /[ \t]*\[question:\d+\][ \t]*/g;

/**
 * One quoted alone in its own code span (which still links), with the span.
 */
const QuestionRefCodeSpan = /`\s*\[question:\d+\]\s*`[ \t]?/g;

/**
 * A bot's own text with its `[question:ID]` refs taken out, for text copied
 * into another bot's conversation (`relayJobToRequester`, a crew request's
 * outcome, an install request's answer). A question belongs to the
 * conversation it was asked in: a copy elsewhere would show a second card
 * whose answer never reaches the bot that asked.
 */
export default function stripQuestionRefs({ text }: Params): Stripped {
    if (!QuestionRef.test(text)) return { text, removed: false };

    return {
        text: text
            .replace(QuestionRefCodeSpan, "")
            .replace(QuestionRefs, " ")
            .replace(/[ \t]+$/gm, "")
            .replace(/\n{3,}/g, "\n\n")
            .trim(),
        removed: true,
    };
}