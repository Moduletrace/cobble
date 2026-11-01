import type { BotWithLastMessage } from "@/src/types";

type Params = {
    /**
     * The worker bots, in the order the rail lists them.
     */
    workers: BotWithLastMessage[];
    /**
     * The open conversation's bot: always listed.
     */
    selected_id?: number;
    limit: number;
};

/**
 * Which workers the rail lists: the first `limit`, plus any
 * older one that's open, unread or needs the user, so nothing that wants
 * attention hides behind "See all bots". The rest go to `hidden`, in the
 * same order.
 */
export default function pickRailBots({ workers, selected_id, limit }: Params) {
    const shown = workers.filter(
        (bot, index) =>
            index < limit || bot.id == selected_id || Boolean(bot.unread) || bot.face == "needs-you",
    );
    const hidden = workers.filter((bot) => !shown.includes(bot));

    return { shown, hidden };
}
