import type { HarnessContentPart, HarnessMessage } from "../types";

type UserContent = Extract<HarnessMessage, { role: "user" }>["content"];

type Params = {
    transcript: HarnessMessage[];
    content: UserContent;
};

/**
 * Adds a user turn to the transcript, joined onto the last one when that is
 * the user's too, since some providers reject repeated roles. Text stays a
 * string while both sides are text.
 *
 * The join replaces the last turn with a new message rather than editing
 * it in place: that message may be one the caller still holds (the user's
 * own message, reused), and mutating it would change their copy too (L5).
 */
export default function pushUserTurn({ transcript, content }: Params) {
    const last = transcript[transcript.length - 1];

    if (last?.role != "user") {
        transcript.push({ role: "user", content });
        return;
    }

    const joined =
        typeof last.content == "string" && typeof content == "string"
            ? [last.content, content].filter(Boolean).join("\n\n")
            : [...toParts({ content: last.content }), ...toParts({ content })];

    transcript[transcript.length - 1] = { role: "user", content: joined };
}

function toParts({ content }: { content: UserContent }): HarnessContentPart[] {
    if (typeof content != "string") return content;

    return content ? [{ type: "text", text: content }] : [];
}
