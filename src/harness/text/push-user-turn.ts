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
 */
export default function pushUserTurn({ transcript, content }: Params) {
    const last = transcript[transcript.length - 1];

    if (last?.role != "user") {
        transcript.push({ role: "user", content });
        return;
    }

    if (typeof last.content == "string" && typeof content == "string") {
        last.content = [last.content, content].filter(Boolean).join("\n\n");
        return;
    }

    last.content = [...toParts({ content: last.content }), ...toParts({ content })];
}

function toParts({ content }: { content: UserContent }): HarnessContentPart[] {
    if (typeof content != "string") return content;

    return content ? [{ type: "text", text: content }] : [];
}
