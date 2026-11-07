import { z } from "zod";
import grabBotById from "@/src/functions/backend/db/bots/grab-bot-by-id";
import chatroomAskableBots from "@/src/functions/backend/db/chatrooms/chatroom-askable-bots";
import createChatroom from "@/src/functions/backend/db/chatrooms/create-chatroom";
import grabCrewRequests from "@/src/functions/backend/db/chatrooms/grab-crew-requests";
import chatroomRef from "@/src/utils/chatroom-ref";
import type { HarnessTool } from "../../types";

type Params = {
    user_id: number | string;
    /**
     * The worker asking.
     */
    bot_id: number | string;
    /**
     * The session it asks from: the answer comes back there.
     */
    session_id: number | string;
    /**
     * Where it works: in a workspace, only its members can be asked.
     */
    workspace_id?: number | string | null;
    /**
     * Called with the room's ref, so the reply always carries its chip.
     */
    onChatroom?: (params: { ref: string }) => void;
};

type Args = {
    title: string;
    request: string;
    bot_id?: number;
    separate?: boolean;
};

/**
 * Lets a worker ask another bot for something, only ever through the
 * coordinator: it opens a chatroom (`createChatroom`) where the
 * coordinator works out who should answer, asks them, and sends the answer
 * back to this conversation, which wakes the bot to act on it. Who can be
 * asked is decided by the app, never the model: in a workspace its
 * members, otherwise every worker the user reaches. While one of its
 * requests from the same place is open, another is refused unless it says
 * it's `separate`: a task run that couldn't see the open one asked bot 20
 * for the same two files a third time.
 */
export default function askCrewTool({ user_id, bot_id, session_id, workspace_id, onChatroom }: Params): HarnessTool<Args> {
    return {
        name: "ask_crew",
        description: `Ask another bot for something you need (what it knows, a file it has, work in its line) through the coordinator. The coordinator reads your request, asks the bot best placed to answer and sends the answer back here as a message, which wakes you to act on it: don't wait or check on it. If a task you'd start needs the answer, don't start it in the same reply: it would run without it, so start it once the answer wakes you. Write the request as a full brief: what you need, why, and what a good answer looks like. Name a bot with bot_id if you know who can help; the coordinator decides. ${
            workspace_id ? "You're in a workspace, so only its members can be asked." : "Any bot the user works with can be asked."
        } The request and everything said about it is kept in a chatroom the user can read. While a request of yours from here is open, a new one is refused unless it asks for something else (separate: true).`,
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

            const askable = await chatroomAskableBots({
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
                const open = (await grabCrewRequests({ user_id, bot_id: bot.id, workspace_id })).filter(
                    (room) => room.status == "open",
                );

                if (open.length) {
                    return `Not asked: you already have ${open
                        .map((room) => `${chatroomRef({ id: room.id! })} "${room.title}"`)
                        .join(", ")} open. Its answer comes back here as a message and wakes you, so don't ask again for the same thing. If this asks for something different, call ask_crew again with separate: true.`;
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

            const room = await createChatroom({
                user_id,
                requester: bot,
                origin_session_id: session_id,
                title: args.title,
                request,
            });

            const ref = chatroomRef({ id: room.id! });

            onChatroom?.({ ref });

            return `Asked the coordinator in ${ref}. The answer comes back here as a message and you'll be woken for it. Tell the user you asked; don't ask again while it's open.`;
        },
    };
}
