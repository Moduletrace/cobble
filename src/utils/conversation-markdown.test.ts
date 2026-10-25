import { describe, expect, test } from "bun:test";
import type { ConversationExport } from "@/src/types";
import conversationMarkdown from "./conversation-markdown";

const format_time = (time: number) => `t${time}`;

const conversation: ConversationExport = {
    bot_name: "Ada",
    workspace_name: "Launch",
    user_name: "Ben",
    session: { id: 1, title: "Kickoff", created_at: 10 },
    messages: [
        { id: 1, session_id: 1, author: "user", text: "Hi [bot:3]", created_at: 11 },
        {
            id: 2,
            session_id: 1,
            author: "bot",
            text: "## Plan\n\nDone.",
            created_at: 12,
            attachments: [{ id: 5, name: "plan.pdf", media_type: "document", url: "" }],
            reactions: [{ emoji: "👍", count: 2, mine: true }],
        },
        {
            id: 3,
            session_id: 1,
            author: "user",
            text: "Thanks",
            created_at: 13,
            reply_to: { id: 2, author: "bot", text: "## Plan\n\nDone." },
        },
    ],
    ref_names: { bots: { 3: "Ada" }, workspaces: {} },
};

describe("conversationMarkdown", () => {
    test("lays out the session's messages", () => {
        expect(conversationMarkdown({ conversation, now: 100, format_time })).toBe(
            [
                "# Kickoff",
                "",
                "- **Bot:** Ada",
                "- **Workspace:** Launch",
                "- **Participants:** Ben, Ada",
                "- **Started:** t10",
                "- **Messages:** 3",
                "- **Copied:** t100",
                "",
                "---",
                "",
                "## Ben · t11",
                "",
                "Hi @Ada",
                "",
                "## Ada · t12",
                "",
                "#### Plan",
                "",
                "Done.",
                "",
                "*Attached: plan.pdf*",
                "",
                "*Reactions: 👍 2*",
                "",
                "## Ben · t13",
                "",
                "> Replying to Ada: Plan Done.",
                "",
                "Thanks",
                "",
            ].join("\n"),
        );
    });

    test("titles an untitled or empty session after the bot", () => {
        const markdown = conversationMarkdown({
            conversation: { ...conversation, session: null, messages: [] },
            now: 1,
            format_time,
        });

        expect(markdown).toStartWith("# Chat with Ada\n");
        expect(markdown).toContain("*No messages yet.*");
        expect(markdown).not.toContain("**Started:**");
    });
});
