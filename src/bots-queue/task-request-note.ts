import type { BUN_SQLITE_COBBLE_BOT_MESSAGES } from "@/db/types/db";

/**
 * The user's own words that asked for a task run, put in front of the
 * bot's brief (`runBotTask`).
 *
 * A task run opens with the brief its bot wrote for itself
 * (`composeJobBrief`), so the request was only in the run if the bot
 * repeated it there: one that shortened it away left its run with the
 * goal and no route, and the run reached the same result by a way the
 * user didn't ask for (a PNG to "layered PSD", locally, when they said to
 * use their ArtCraft MCP). The message that asked for the work is on the
 * job (`bots_queue.message_id`, from `start_task`), so the run reads the
 * request itself, and `TaskRunNote` says the words win over the brief.
 *
 * Empty for a message the user didn't write (a crew message that asked
 * for the work, an app notice) and for one with no text.
 */
export default function taskRequestNote({
    message,
}: {
    message?: Pick<BUN_SQLITE_COBBLE_BOT_MESSAGES, "author" | "text"> | null;
}) {
    if (message?.author !== "user") return "";

    const text = (message.text || "").trim();

    if (!text) return "";

    return `# What the user asked for

This is the request itself, as they wrote it. The brief below it is your own summary: where they disagree these words win, and the way they named is the way it is done.

${text}`;
}