import BunSQLite from "@moduletrace/bun-sqlite";
import type { BotSuggestionView } from "@/src/types";
import grabBotSuggestion from "./grab-bot-suggestion";
import parseBotSuggestionRow from "@/src/utils/parse-bot-suggestion-row";

type Params = {
    suggestion_id: number | string;
    user_id: number | string;
};

/**
 * Next steps a bot suggested as the thread shows them: its heading and the
 * steps, each a button that puts it in the user's input.
 */
export default async function grabBotSuggestionView({ suggestion_id, user_id }: Params): Promise<BotSuggestionView> {
    const row = await grabBotSuggestion({ suggestion_id, user_id });
    const { steps } = parseBotSuggestionRow({ row });

    const bot = (
        await BunSQLite.sql<{ name: string }>({
            sql: `SELECT name FROM bots WHERE id = ? LIMIT 1`,
            values: [row.bot_id || 0],
        })
    ).payload?.[0];

    return {
        id: Number(row.id),
        title: row.title || "",
        steps,
        bot_id: Number(row.bot_id),
        bot_name: bot?.name || "The bot",
    };
}