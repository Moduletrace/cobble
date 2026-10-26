import { z } from "zod";
import BunSQLite from "@moduletrace/bun-sqlite";
import { AppData } from "@/src/data/app-data";
import searchPastSessionsSql, { type PastSessionScope } from "@/src/functions/backend/db/bot-sessions/past-session-messages-sql";
import type { HarnessTool } from "../../../types";
import describePastMessage from "./describe-past-message";

type Args = {
    query: string;
    before_id?: number;
};

type Match = {
    id: number;
    session_id: number;
    author: string;
    created_at: number;
    session_title: string | null;
    snippet: string | null;
};

/**
 * Lets a reply search what was said in the conversation's earlier
 * sessions (this user, this bot, this place), which its prompt only has
 * as a summary.
 */
export default function searchPastSessionsTool(scope: PastSessionScope): HarnessTool<Args> {
    return {
        name: "search_past_sessions",
        description: `Search the messages of your earlier sessions with this user here, newest first, when you need more detail than the summary of what came before (an exact figure, a link, what was agreed). Every word in query must be in the message. Each match shows its message id and session; read_past_session reads around it.`,
        schema: z.object({
            query: z.string().trim().min(1).max(200).describe(`Words to find`),
            before_id: z.number().int().positive().optional().describe(`Only messages older than this id, for the next page`),
        }),
        run: async ({ args }) => {
            const { sql, values } = searchPastSessionsSql({ ...scope, query: args.query, before_id: args.before_id });
            const matches = (await BunSQLite.sql<Match>({ sql, values })).payload || [];

            if (!matches.length) return `No messages of earlier sessions match.`;

            const list = matches
                .map(
                    (match) =>
                        `${describePastMessage({ ...match, text: `...${match.snippet || ""}...` })} [session #${match.session_id}${match.session_title ? ` "${match.session_title}"` : ""}]`,
                )
                .join("\n");
            const last = matches[matches.length - 1];

            return matches.length >= AppData.PastSessionSearchLimit
                ? `${list}\n\nMore may be older: search again with before_id ${last?.id}.`
                : list;
        },
    };
}
