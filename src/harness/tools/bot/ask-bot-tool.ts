import { z } from "zod";
import askableBots from "@/src/functions/backend/db/asks/askable-bots";
import createAsk from "@/src/functions/backend/db/asks/create-ask";
import grabCrewRequests from "@/src/functions/backend/db/asks/grab-crew-requests";
import grabBotById from "@/src/functions/backend/db/bots/grab-bot-by-id";
import { AppData } from "@/src/data/app-data";
import type { HarnessTool } from "../../types";

type Params = {
    user_id: number | string;
    /**
     * The worker asking.
     */
    bot_id: number | string;
    /**
     * The session it asks from: the outcome comes back there.
     */
    session_id: number | string;
    /**
     * Where it works: in a workspace, only its members can be asked.
     */
    workspace_id?: number | string | null;
};

type Args = {
    title: string;
    request: string;
    bot_id?: number;
    separate?: boolean;
};

/**
 * Lets a worker ask another bot for something, through the coordinator's
 * gate: the request is queued (`createAsk`), the coordinator approves it,
 * redirects it or refuses it with a reason, and the answer comes back to this
 * conversation as a message that wakes the bot. Who can be asked is the app's
 * call, never the model's: in a workspace its members, otherwise every worker
 * the user reaches.
 */
export default function askBotTool({ user_id, bot_id, session_id, workspace_id }: Params): HarnessTool<Args> {
    return {
        name: "ask_bot",
        description: `Ask another bot for something you need (what it knows, a file it has, work in its line). The coordinator reads every request first: it passes it to the bot that should answer, sends it to a better-placed bot, or turns it down with the reason. An approved request's answer comes back here as a message, which wakes you to act on it: don't wait or check on it. If a task you'd start needs the answer, don't start it in the same reply: it would run without it, so start it once the answer wakes you. Write the request as a full brief: what you need, why, and what a good answer looks like. Name a bot with bot_id if you know who can help; the coordinator decides. ${
            workspace_id ? "You're in a workspace, so only its members can be asked." : "Any bot the user works with can be asked."
        } Up to ${AppData.AskMaxOpenPerBot} of your requests can be open at once. While one is open, another is refused unless it asks for something different (separate: true).`,
        schema: z.object({
            title: z.string().trim().min(1).max(80).describe("A short label for the request"),
            request: z.string().trim().min(1).max(8000).describe("The brief, in markdown"),
            bot_id: z.number().int().optional().describe("The bot you think can help, if you know"),
            separate: z
                .boolean()
                .optional()
                .describe("true when this asks for something different from a request of yours that's still open"),
        }),
        run: async ({ args }) => {
            const bot = await grabBotById({ bot_id });

            if (!bot?.id) {
                throw new Error(`This bot no longer exists.`);
            }

            const askable = await askableBots({
                user_id,
                requester_bot_id: bot.id,
                workspace_id,
            });

            if (!askable.length) {
                throw new Error(
                    workspace_id
                        ? `There are no other bots in this workspace to ask.`
                        : `There are no other bots the user works with to ask.`,
                );
            }

            if (!args.separate) {
                const open = (await grabCrewRequests({ user_id, bot_id: bot.id, workspace_id, since: 0 })).filter(
                    (request) => request.status == "pending" || request.status == "working",
                );

                if (open.length) {
                    return `Not asked: you already have ${open
                        .map((request) => `"${request.title}" (ask #${request.id})`)
                        .join(", ")} open. Its outcome comes back here as a message and wakes you, so don't ask again for the same thing. If this asks for something different, call ask_bot again with separate: true.`;
                }
            }

            const named = args.bot_id ? askable.find((other) => other.id == args.bot_id) : null;

            if (args.bot_id && !named) {
                throw new Error(
                    `Bot ${args.bot_id} can't be asked from here. You can ask: ${askable
                        .map((other) => `${other.id}: ${other.name}`)
                        .join("; ")}.`,
                );
            }

            const request = named ? `${args.request}\n\n(I think ${named.name} [bot:${named.id}] can help.)` : args.request;

            const ask = await createAsk({
                user_id,
                requester: bot,
                origin_session_id: session_id,
                target_bot_id: named?.id || askable[0]!.id!,
                title: args.title,
                request,
            });

            return `Asked ${named ? `${named.name} [bot:${named.id}]` : "the crew"} (ask #${ask.id}). The coordinator reads it first; its outcome comes back here as a message and you'll be woken for it. Tell the user you asked; don't ask again while it's open.`;
        },
    };
}
