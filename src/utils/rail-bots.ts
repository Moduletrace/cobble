import { AppData } from "@/src/data/app-data";
import type { BotWithLastMessage } from "@/src/types";
import messagePreview from "./message-preview";

/**
 * Bots as page props carry them for the rail and the crew lists: without
 * their core instructions and memory (the largest part of a row, and only
 * the bot's own edit form reads them, loading them when it opens), and
 * with the last message cut to a one-line preview.
 */
export default function railBots<T extends BotWithLastMessage>({ bots }: { bots: T[] }): T[] {
    return bots.map(({ system_prompt, memory, ...bot }) => ({
        ...bot,
        last_message_text: bot.last_message_text
            ? messagePreview({ text: bot.last_message_text }).slice(0, AppData.RailPreviewMaxChars)
            : bot.last_message_text,
    })) as T[];
}
