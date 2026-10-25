import type { BotMessageWithAttachments, ConversationExport } from "@/src/types";
import exportMessageText from "./export-message-text";
import messagePreview from "./message-preview";

type Params = {
    conversation: ConversationExport;
    /**
     * When the copy was made.
     */
    now: number;
    /**
     * A timestamp as the reader sees it; local time by default.
     */
    format_time?: (time: number) => string;
};

/**
 * Longest a quoted message runs in a reply's "Replying to" line.
 */
const QuoteMaxChars = 120;

/**
 * A conversation's session (`grabConversationExport`) as one markdown
 * document: a title and summary, then every message under its author and
 * time. Messages' own headings drop below those (`exportMessageText`) and
 * their refs read as names.
 */
export default function conversationMarkdown({
    conversation,
    now,
    format_time = (time) =>
        new Date(time).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
        }),
}: Params) {
    const { bot_name, workspace_name, user_name, session, messages, ref_names } = conversation;

    const authorName = (author?: string) => (author == "bot" ? bot_name : user_name);

    const messageBlock = (message: BotMessageWithAttachments) => {
        const lines = [`## ${authorName(message.author)} · ${format_time(Number(message.created_at))}`, ""];

        if (message.reply_to) {
            const quote = messagePreview({ text: message.reply_to.text || "" });

            lines.push(
                `> Replying to ${authorName(message.reply_to.author)}: ${
                    quote.length > QuoteMaxChars ? `${quote.slice(0, QuoteMaxChars).trimEnd()}...` : quote
                }`,
                "",
            );
        }

        const text = exportMessageText({
            text: message.text || "",
            bot_names: ref_names.bots,
            workspace_names: ref_names.workspaces,
            heading_offset: 2,
        });

        if (text) lines.push(text, "");

        if (message.attachments?.length) {
            lines.push(`*Attached: ${message.attachments.map((file) => file.name).join(", ")}*`, "");
        }

        if (message.reactions?.length) {
            lines.push(
                `*Reactions: ${message.reactions
                    .map((reaction) => (reaction.count > 1 ? `${reaction.emoji} ${reaction.count}` : reaction.emoji))
                    .join(" ")}*`,
                "",
            );
        }

        return lines.join("\n");
    };

    const out: string[] = [
        `# ${session?.title?.trim() || `Chat with ${bot_name}`}`,
        "",
        `- **Bot:** ${bot_name}`,
    ];

    if (workspace_name) out.push(`- **Workspace:** ${workspace_name}`);

    out.push(`- **Participants:** ${user_name}, ${bot_name}`);

    if (session) out.push(`- **Started:** ${format_time(session.created_at)}`);

    out.push(
        `- **Messages:** ${messages.length}`,
        `- **Copied:** ${format_time(now)}`,
        "",
        "---",
        "",
    );

    if (!messages.length) out.push("*No messages yet.*", "");

    out.push(...messages.map(messageBlock));

    return `${out.join("\n").trimEnd()}\n`;
}
