import { z } from "zod";
import botRef from "@/src/utils/bot-ref";
import grabBotAsks from "@/src/functions/backend/db/asks/grab-bot-asks";
import type { HarnessTool } from "../../types";

type Params = {
    user_id: number | string;
    /**
     * The bot that asked.
     */
    bot_id: number | string;
};

type Args = {
    limit?: number;
};

const StatusLines: Record<string, string> = {
    pending: "waiting on the coordinator",
    working: "with the bot that took it; the answer comes back to this conversation",
    answered: "answered; its answer is in this conversation",
    refused: "refused; the reason is in this conversation",
    failed: "failed; the reason is in this conversation",
    stopped: "stopped by the user",
};

/**
 * What a bot made of its own requests: without it, a bot that mentioned an
 * id or a status was making it up. Read from the app's record, never the
 * model's memory.
 */
export default function listAsksTool({ user_id, bot_id }: Params): HarnessTool<Args> {
    return {
        name: "list_asks",
        description:
            "Lists the most recent requests this bot made to other bots, with their real status. Use it before asking again, or when the user asks whether a request went out or came back.",
        schema: z.object({ limit: z.number().int().min(1).max(20).optional() }),
        run: async ({ args }) => {
            const asks = await grabBotAsks({ user_id, bot_id, limit: args.limit });

            if (!asks.length) return "No requests were made from this bot yet.";

            return [
                "Requests this bot made to other bots, newest first:",
                ...asks.map((ask) => {
                    const target = ask.target_bot_id
                        ? botRef({ id: ask.target_bot_id })
                        : "the crew";
                    const status = StatusLines[ask.status] || ask.status;

                    return `- ask #${ask.id} "${ask.title}" to ${target}${
                        ask.target_name ? ` ${ask.target_name}` : ""
                    }: ${status}`;
                }),
                "The ids and statuses here are the app's own record. Never invent one.",
            ].join("\n");
        },
    };
}
