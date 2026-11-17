import claimsWorkUnderWay from "./claims-work-under-way";
import sanitizeAnswerText from "./sanitize-answer-text";

/**
 * The answer with the parts the app's record can't support taken out,
 * sentence by sentence: a sentence saying work goes on past this reply, or
 * that a report is still to come, is removed when nothing was started and
 * nothing of the run's is open. What is left is what the tools returned, so
 * it holds up on its own. `changed` is false when there was nothing to take
 * out, and the answer is then refused as it was before: an answer the app
 * knows is wrong is never sent.
 */
export default function repairAnswerText({ text }: { text: string }) {
    const sentences = text.split(/(?<=[.!?])\s+|\n/);
    const kept = sentences.filter((sentence) => !sentence.trim() || !claimsWorkUnderWay({ text: sentence }));
    const repaired = sanitizeAnswerText({ text: kept.join(" ") }).trim();

    return { text: repaired, changed: kept.length != sentences.length };
}