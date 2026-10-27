import { z } from "zod";
import type { BUN_SQLITE_COBBLE_CHATROOMS } from "@/db/types/db";
import BunSQLite from "@moduletrace/bun-sqlite";
import pushBotNotice from "@/src/bots-queue/push-bot-notice";
import enqueueBotJob from "@/src/functions/backend/db/bots-queue/enqueue-bot-job";
import ensureBotSession from "@/src/functions/backend/db/bot-sessions/ensure-bot-session";
import insertBotMessage from "@/src/functions/backend/db/bots/insert-bot-message";
import grabBotComputers from "@/src/functions/backend/db/computers/grab-bot-computers";
import chatroomAncestry from "@/src/functions/backend/db/chatrooms/chatroom-ancestry";
import chatroomAskableBots from "@/src/functions/backend/db/chatrooms/chatroom-askable-bots";
import ensureChatroomSession from "@/src/functions/backend/db/chatrooms/ensure-chatroom-session";
import pushChatroomUpdated from "@/src/functions/backend/db/chatrooms/push-chatroom-updated";
import chatroomRef from "@/src/utils/chatroom-ref";
import type { HarnessTool } from "../../types";

type Params = {
    chatroom: BUN_SQLITE_COBBLE_CHATROOMS;
    /**
     * Called once a bot is at work on it: the turn is done.
     */
    onAsked?: () => void;
};

type Args = {
    bot_id: number;
    title: string;
    instructions: string;
};

/**
 * The coordinator's way, in a chatroom, to pass the request to a bot: a
 * task for that bot in its part of the room, on its computer there, for
 * the room's user. Only bots the asking bot may reach (`chatroomAskableBots`,
 * read fresh) and never one that is waiting on this request further up
 * the chain, so two bots can't ask each other in a loop. The asked bot's
 * own conversation gets a note pointing to the room.
 */
export default function askMemberTool({ chatroom, onAsked }: Params): HarnessTool<Args> {
    return {
        name: "ask_member",
        description: `Pass the request, or a follow-up on it, to a bot. It works on it as a task and what it reports comes back to you in this room. Write the instructions as a full brief: what is needed, why, and what a good answer looks like.`,
        schema: z.object({
            bot_id: z.number().int(),
            title: z.string().trim().min(1).max(80),
            instructions: z.string().trim().min(1).max(8000),
        }),
        run: async ({ args }) => {
            const user_id = Number(chatroom.user_id);
            const workspace_id = chatroom.workspace_id ? Number(chatroom.workspace_id) : null;

            const askable = await chatroomAskableBots({
                user_id,
                requester_bot_id: chatroom.requester_bot_id || 0,
                workspace_id,
            });
            const bot = askable.find((other) => other.id == args.bot_id);

            if (!bot?.id) {
                throw new Error(
                    `Bot ${args.bot_id} can't be asked here. You can ask: ${
                        askable.map((other) => `${other.id}: ${other.name}`).join("; ") || "nobody"
                    }.`,
                );
            }

            /**
             * A bot waiting on this request higher up would end up asking
             * itself, round and round.
             */
            const chain = await chatroomAncestry({ chatroom_id: chatroom.parent_chatroom_id });

            if (chain.some((room) => room.requester_bot_id == bot.id)) {
                throw new Error(`${bot.name} is waiting on this request itself, so it can't be asked to answer it.`);
            }

            const session = await ensureChatroomSession({ chatroom, bot_id: bot.id });

            const busy = (
                await BunSQLite.sql({
                    sql: `SELECT id FROM bots_queue WHERE session_id = ? AND status IN ('pending', 'processing') LIMIT 1`,
                    values: [session.id!],
                })
            ).payload?.[0];

            if (busy) {
                throw new Error(`${bot.name} is already working on something in this room. Wait for it.`);
            }

            const computers = await grabBotComputers({ bot_id: bot.id, workspace_id });

            const job_id = await enqueueBotJob({
                user_id,
                bot_id: bot.id,
                session_id: Number(session.id),
                title: args.title,
                instructions: `${args.instructions}\n\n(The coordinator is asking on behalf of another bot, for the user. Answer with what was asked for: your report goes back to the coordinator.)`,
                computer_id: computers[0]?.id || undefined,
                params: { chatroom_id: chatroom.id },
            });

            await BunSQLite.sql({
                sql: `UPDATE chatrooms SET target_bot_id = ?, updated_at = ? WHERE id = ?`,
                values: [bot.id, Date.now(), chatroom.id!],
            });

            await pushChatroomUpdated({ chatroom_id: chatroom.id! }).catch(() => {});

            /**
             * The bot's own conversation says where it's working, so the
             * user finds the room from there too.
             */
            const own = await ensureBotSession({ user_id, bot_id: bot.id, workspace_id });

            await pushBotNotice({
                bot_id: bot.id,
                message: await insertBotMessage({
                    bot_id: bot.id,
                    session_id: Number(own.id),
                    workspace_id,
                    text: `The coordinator asked me to: **${args.title}** (${chatroomRef({ id: chatroom.id! })})`,
                }),
            });

            onAsked?.();

            return `${bot.name} is on it (job #${job_id}). What they report comes back to you here; end this turn now.`;
        },
    };
}
