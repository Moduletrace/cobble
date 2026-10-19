import { sendToUser } from "@/src/websocket/(functions)/send-to-user";

type Params = {
    bot_id: number | string;
    /**
     * Everyone who saw the bot, read before its row was deleted: afterwards
     * its assignments and workspace places are gone with it, so its
     * audience can't be worked out any more.
     */
    user_ids: number[];
};

/**
 * Pushes `server:bot-removed` to everyone who could see a bot that was
 * deleted, so its rail row goes at once and nothing opens a dead
 * conversation.
 */
export default function pushBotRemoved({ bot_id, user_ids }: Params) {
    for (const user_id of user_ids) {
        sendToUser({
            user_id,
            data: {
                event: "server:bot-removed",
                data: { bot_id: Number(bot_id) },
            },
        });
    }
}
