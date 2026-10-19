import type { HarnessContentPart, HarnessMessage } from "@/src/harness/types";
import type { BotMessageWithAttachments } from "@/src/types";

type Params = {
    messages: Pick<BotMessageWithAttachments, "id" | "author" | "text" | "attachments">[];
    /**
     * Loaded files by message id (`loadAttachmentParts`). Files of other
     * messages are only named.
     */
    parts?: Map<number, HarnessContentPart[]>;
};

type Turn = { role: "user" | "assistant"; parts: HarnessContentPart[] };

/**
 * A bot's conversation (oldest first) as model turns: the user's messages
 * (with their files) as user turns, the bot's as its own. Back-to-back
 * messages from the same side are joined, since some providers reject
 * repeated roles. Leading bot messages are dropped so the conversation
 * starts with the user. A turn that is only text stays a string.
 */
export default function botMessagesToHarness({ messages, parts }: Params): HarnessMessage[] {
    const turns: Turn[] = [];

    for (const message of messages) {
        const role = message.author == "user" ? "user" : "assistant";
        const content = messageParts({ message, role, parts });

        if (!content.length) continue;
        if (!turns.length && role == "assistant") continue;

        const last = turns[turns.length - 1];

        if (last?.role == role) {
            last.parts.push(...content);
        } else {
            turns.push({ role, parts: content });
        }
    }

    return turns.map(({ role, parts }) => {
        const merged = mergeText({ parts });

        if (role == "assistant" || merged.every((part) => part.type == "text")) {
            return {
                role,
                content: merged.map((part) => (part.type == "text" ? part.text : "")).join("\n\n"),
            };
        }

        return { role, content: merged };
    });
}

function messageParts({
    message,
    role,
    parts,
}: {
    message: Params["messages"][number];
    role: Turn["role"];
    parts?: Params["parts"];
}): HarnessContentPart[] {
    const text = message.text?.trim();
    const content: HarnessContentPart[] = text ? [{ type: "text", text }] : [];

    if (role == "assistant" || !message.attachments?.length) return content;

    const loaded = parts?.get(Number(message.id));

    if (loaded?.length) return [...content, ...loaded];

    return [
        ...content,
        {
            type: "text",
            text: `[Attached earlier: ${message.attachments.map((file) => `"${file.name}"`).join(", ")}]`,
        },
    ];
}

/**
 * Joins neighbouring text parts with a blank line.
 */
function mergeText({ parts }: { parts: HarnessContentPart[] }) {
    const merged: HarnessContentPart[] = [];

    for (const part of parts) {
        const last = merged[merged.length - 1];

        if (part.type == "text" && last?.type == "text") {
            merged[merged.length - 1] = { type: "text", text: `${last.text}\n\n${part.text}` };
        } else {
            merged.push(part);
        }
    }

    return merged;
}
