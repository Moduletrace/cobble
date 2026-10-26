import { z } from "zod";
import { AppData } from "@/src/data/app-data";
import grabPastSessionMessages from "@/src/functions/backend/db/bot-sessions/grab-past-session-messages";
import type { PastSessionScope } from "@/src/functions/backend/db/bot-sessions/past-session-messages-sql";
import type { HarnessTool } from "../../../types";
import describePastMessage from "./describe-past-message";

type Args = {
    message_id?: number;
    session_id?: number;
    after_id?: number;
};

/**
 * Lets a reply read an earlier session of the conversation word for word:
 * around a message found with `search_past_sessions`, or a session in
 * order (the one this session carries on from by default).
 */
export default function readPastSessionTool(scope: PastSessionScope): HarnessTool<Args> {
    return {
        name: "read_past_session",
        description: `Read messages of an earlier session with this user here, oldest first. With message_id: the messages around it. Otherwise a session in order from its start (session_id, or the session this one carries on from), after_id for the next page. Read only what you need: it is long.`,
        schema: z.object({
            message_id: z.number().int().positive().optional(),
            session_id: z.number().int().positive().optional(),
            after_id: z.number().int().positive().optional(),
        }),
        run: async ({ args }) => {
            const read = await grabPastSessionMessages({
                ...scope,
                message_id: args.message_id,
                session_id: args.session_id,
                after_id: args.after_id,
                limit: AppData.PastSessionReadMessages,
            });

            const head = `Session #${read.session.id}${read.session.title ? ` "${read.session.title}"` : ""}${read.session.previous_session_id ? `, carrying on from session #${read.session.previous_session_id}` : ""}:`;

            if (!read.messages.length) return `${head}\n(no messages${args.after_id ? " after that" : ""})`;

            const lines = read.messages.map((message) =>
                describePastMessage({
                    ...message,
                    text: (message.text || "").slice(0, AppData.PastSessionReadMessageChars),
                }),
            );
            const last = read.messages[read.messages.length - 1];

            return [
                head,
                ...lines,
                read.has_more ? `\nMore follows: read again with session_id ${read.session.id} and after_id ${last?.id}.` : "",
            ]
                .filter(Boolean)
                .join("\n\n");
        },
    };
}
