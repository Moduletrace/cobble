import { AppCardRefTools, type AppCardRefKind } from "./reply-claim-problems";

type Params = {
    text: string;
};

const CardRefKinds = Object.keys(AppCardRefTools) as AppCardRefKind[];

/**
 * One card ref alone in its code span (which still links), with the span.
 */
const codeSpan = ({ kind }: { kind: AppCardRefKind }) => new RegExp(`\`\\s*\\[${kind}:\\d+\\]\\s*\`[ \\t]?`, "gi");

/**
 * A ref between words leaves one space behind, never two: `[ \t]*` around it
 * stays on the same line, so paragraph breaks survive.
 */
const inline = ({ kind }: { kind: AppCardRefKind }) => new RegExp(`[ \\t]*\\[${kind}:\\d+\\][ \\t]*`, "gi");

/**
 * A bot's own text with the refs of the cards the app adds under a message
 * taken out (`[question:24]`, `[suggestion:7]`, `[plan:3]`). The app writes
 * every one of those from the tool that made the card, so one in the model's
 * text was written by hand, and the user reads it as a card that was never
 * made ("not available") or as a second copy of one. Taken out rather than
 * sent back for a rewrite: three faults in one run cost the user an answer,
 * and a model that sees the ref in its own history learns to write it again
 * (session 146: a whole thread of `[question:N]` refs it had never made).
 */
export default function stripCardRefs({ text }: Params): string {
    if (!CardRefKinds.some((kind) => new RegExp(`\\[${kind}:\\d+\\]`, "i").test(text))) return text;

    let stripped = text;

    for (const kind of CardRefKinds) {
        stripped = stripped.replace(codeSpan({ kind }), "").replace(inline({ kind }), " ");
    }

    return stripped
        .replace(/[ \t]+$/gm, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}