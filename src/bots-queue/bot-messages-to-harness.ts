import describeToolUses from "@/src/harness/text/describe-tool-uses";
import type { HarnessContentPart, HarnessMessage, HarnessToolUse } from "@/src/harness/types";
import type { BotMessageWithAttachments } from "@/src/types";
import describeMessageRefs, { type MessageRefNames } from "@/src/utils/describe-message-refs";
import { AppRecordPrefix } from "@/src/utils/strip-app-records";
import describeAttachment from "./describe-attachment";

type Params = {
    messages: Pick<
        BotMessageWithAttachments,
        "id" | "author" | "text" | "attachments" | "reply_to" | "tool_log"
    >[];
    /**
     * Loaded files by message id (`loadAttachmentParts`). Files of other
     * messages are only named.
     */
    parts?: Map<number, HarnessContentPart[]>;
    /**
     * Names of the bots and workspaces the user's messages mention
     * (`grabMessageRefNames`), told to the bot after each one.
     */
    refs?: MessageRefNames;
};

type Turn = { role: "user" | "assistant"; parts: HarnessContentPart[] };

/**
 * A bot's conversation (oldest first) as model turns: the user's messages
 * (with their files) as user turns, the bot's as its own. Back-to-back
 * messages from the same side are joined, since some providers reject
 * repeated roles. Leading bot messages are dropped so the conversation
 * starts with the user. A turn that is only text stays a string. A bot
 * message whose run was recorded (`tool_log`) is followed by the app's
 * record of the tools it called, so the bot can tell what its past
 * messages actually did from what they say.
 */
export default function botMessagesToHarness({ messages, parts, refs }: Params): HarnessMessage[] {
    const turns: Turn[] = [];

    for (const message of messages) {
        const role = message.author == "user" ? "user" : "assistant";
        const content = messageParts({ message, role, parts, refs });

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
    refs,
}: {
    message: Params["messages"][number];
    role: Turn["role"];
    parts?: Params["parts"];
    refs?: Params["refs"];
}): HarnessContentPart[] {
    const own = message.text?.trim() || "";
    const mentions = role == "user" && refs && own ? describeMessageRefs({ text: own, names: refs }) : "";
    const text = replyContext({ message, text: mentions ? `${own}\n\n${mentions}` : own });
    const content: HarnessContentPart[] = text ? [{ type: "text", text }] : [];

    if (role == "assistant") {
        const record = text ? appRecord({ tool_log: message.tool_log }) : "";

        return record ? [...content, { type: "text", text: record }] : content;
    }

    if (!message.attachments?.length) return content;

    const loaded = parts?.get(Number(message.id));

    if (loaded?.length) return [...content, ...loaded];

    return [
        ...content,
        {
            type: "text",
            text: `[Attached earlier: ${message.attachments.map((file) => describeAttachment({ name: file.name, id: file.id })).join(", ")}]`,
        },
    ];
}

/**
 * The app's line after a bot message naming the tools its run called, or
 * nothing when the run wasn't recorded.
 */
function appRecord({ tool_log }: { tool_log?: string | null }) {
    if (!tool_log) return "";

    let uses: HarnessToolUse[];

    try {
        uses = JSON.parse(tool_log);
    } catch {
        return "";
    }

    if (!Array.isArray(uses)) return "";

    const called = uses.length ? describeToolUses({ uses }) : "no tools";

    return `${AppRecordPrefix} this message's run called ${called}.]`;
}

/**
 * Names the message a user turn answers, so the bot reads the reply in
 * context even when the quoted message is further back. A reply with
 * only files still gets the quote.
 */
function replyContext({
    message,
    text,
}: {
    message: Params["messages"][number];
    text: string;
}) {
    if (message.author != "user" || !message.reply_to) return text;

    const quote = message.reply_to.text.trim().slice(0, 500) || "(a file)";

    return `[Replying to ${message.reply_to.author == "user" ? "the user's own earlier message" : "your earlier message"}: "${quote}"]${text ? `\n\n${text}` : ""}`;
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
