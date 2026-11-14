import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_ASKS, BUN_SQLITE_COBBLE_BOTS, BunSQLiteTables } from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import AppError from "@/src/utils/app-error";
import grabUserBotSession from "../bot-sessions/grab-user-bot-session";
import askableBots from "./askable-bots";
import askAncestry from "./ask-ancestry";
import countOpenAsks from "./count-open-asks";
import enqueueAskReview from "./enqueue-ask-review";
import { truncateText } from "@/src/utils/truncate-text";

type Params = {
    user_id: number | string;
    requester: BUN_SQLITE_COBBLE_BOTS;
    /**
     * The run's session the answer goes back to and wakes.
     */
    origin_session_id: number | string;
    target_bot_id: number | string;
    title: string;
    request: string;
};

/**
 * Queues one bot's request to another for the coordinator's gate. Everything
 * checked here is the app's call (`askableBots`, the depth, the open cap);
 * whether the request is worth passing on is the coordinator's.
 */
export default async function createAsk({
    user_id,
    requester,
    origin_session_id,
    target_bot_id,
    title,
    request,
}: Params): Promise<BUN_SQLITE_COBBLE_BOT_ASKS> {
    if (requester.kind == "coordinator") {
        throw new AppError(`The coordinator hands work out itself; it doesn't ask the crew.`);
    }

    const origin = await grabUserBotSession({ session_id: origin_session_id, user_id });

    if (!origin?.id || Number(origin.bot_id) != Number(requester.id)) {
        throw new AppError(`That request doesn't come from this bot's conversation.`);
    }

    if (origin.hook_id) {
        throw new AppError(`A hook call can't ask the crew.`);
    }

    const workspace_id = origin.workspace_id || null;
    const askable = await askableBots({
        user_id,
        requester_bot_id: requester.id!,
        workspace_id,
    });

    if (!askable.some((bot) => Number(bot.id) == Number(target_bot_id))) {
        throw new AppError(`That bot can't be asked from here.`);
    }

    if ((await countOpenAsks({ user_id, requester_bot_id: requester.id! })) >= AppData.AskMaxOpenPerBot) {
        throw new AppError(
            `You already have ${AppData.AskMaxOpenPerBot} requests open with the crew. Wait for their answers first.`,
        );
    }

    const parent_ask_id = origin.ask_id || null;

    if (parent_ask_id) {
        const chain = await askAncestry({ ask_id: parent_ask_id });

        /**
         * The chain holds the requests this one comes from: the new one is
         * one hop deeper than the last.
         */
        if (chain.length + 1 > AppData.AskMaxDepth) {
            throw new AppError(`Requests can't be passed down this far. Answer the request you have.`);
        }

        if (chain.includes(Number(target_bot_id))) {
            throw new AppError(`That bot is waiting on the answer to this request. Ask someone else.`);
        }
    }

    const now = Date.now();

    const res = await BunSQLite.insert<BUN_SQLITE_COBBLE_BOT_ASKS, (typeof BunSQLiteTables)[number]>({
        table: "bot_asks",
        data: [
            {
                user_id: Number(user_id),
                workspace_id: workspace_id ? Number(workspace_id) : undefined,
                requester_bot_id: Number(requester.id),
                target_bot_id: Number(target_bot_id),
                origin_session_id: Number(origin_session_id),
                parent_ask_id: parent_ask_id ? Number(parent_ask_id) : undefined,
                title: truncateText({ text: title.trim(), max: 120 }),
                request: truncateText({ text: request.trim(), max: AppData.AskBriefMaxChars }),
                status: "pending",
            },
        ],
    });

    const id = res.postInsertReturn?.insertId;

    if (!res.success || !id) {
        throw new Error(`Couldn't save the request: ${res.msg}`);
    }

    const ask: BUN_SQLITE_COBBLE_BOT_ASKS = {
        id,
        user_id: Number(user_id),
        workspace_id: workspace_id ? Number(workspace_id) : undefined,
        requester_bot_id: Number(requester.id),
        target_bot_id: Number(target_bot_id),
        origin_session_id: Number(origin_session_id),
        parent_ask_id: parent_ask_id ? Number(parent_ask_id) : undefined,
        title: truncateText({ text: title.trim(), max: 120 }),
        request: truncateText({ text: request.trim(), max: AppData.AskBriefMaxChars }),
        status: "pending",
        created_at: now,
        updated_at: now,
    };

    await enqueueAskReview({ ask });

    return ask;
}
