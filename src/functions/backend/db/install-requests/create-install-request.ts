import BunSQLite from "@moduletrace/bun-sqlite";
import type {
    BUN_SQLITE_COBBLE_BOTS,
    BUN_SQLITE_COBBLE_COMPUTERS,
    BUN_SQLITE_COBBLE_INSTALL_REQUESTS,
    BUN_SQLITE_COBBLE_USERS,
    BunSQLiteTables,
} from "@/db/types/db";
import pushBotNotice from "@/src/bots-queue/push-bot-notice";
import wakeBotsQueue from "@/src/bots-queue/wake-bots-queue";
import type { InstallPackageManager } from "@/src/dict/install-request-dict";
import AppError from "@/src/utils/app-error";
import installRequestAsked from "@/src/utils/install-request-asked";
import installRequestBlock from "@/src/utils/install-request-block";
import ensureBotSession from "../bot-sessions/ensure-bot-session";
import insertBotMessage from "../bots/insert-bot-message";
import enqueueBotJob from "../bots-queue/enqueue-bot-job";
import grabCoordinatorBot from "../bots/grab-coordinator-bot";

type Params = {
    /**
     * The user the worker's run is for, who hears the answer.
     */
    user_id: number | string;
    /**
     * The worker asking, and the session its answer goes back to.
     */
    bot_id: number | string;
    session_id: number | string;
    workspace_id?: number | string | null;
    computer_id: number | string;
    packages: { manager: InstallPackageManager; name: string }[];
    reason: string;
    notes?: string | null;
};

/**
 * Records a worker's install request and queues the coordinator's task
 * that weighs it, on that computer, in the conversation the coordinator
 * has with its owner (the super admin): they see every request and what
 * was decided, and can step in. One open request per bot and computer.
 * Returns the request and the coordinator's job. Throws an `AppError` the
 * bot is told.
 */
export default async function createInstallRequest({
    user_id,
    bot_id,
    session_id,
    workspace_id,
    computer_id,
    packages,
    reason,
    notes,
}: Params) {
    const open = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_INSTALL_REQUESTS>({
            sql: `SELECT id FROM install_requests WHERE bot_id = ? AND computer_id = ? AND status = 'pending' LIMIT 1`,
            values: [Number(bot_id), Number(computer_id)],
        })
    ).payload?.[0];

    if (open?.id) {
        throw new AppError(
            `You already asked (install request #${open.id}) and the coordinator hasn't answered yet. End your run saying you're waiting for it; you're woken with the answer.`,
        );
    }

    const coordinator = await grabCoordinatorBot();
    const owner_id = Number(coordinator?.user_id) || 0;

    if (!coordinator?.id || !owner_id) {
        throw new AppError(`There's no coordinator to install it. Tell the user what you need installed and why.`);
    }

    const bot = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_BOTS>({ sql: `SELECT name FROM bots WHERE id = ? LIMIT 1`, values: [Number(bot_id)] })
    ).payload?.[0];
    const person = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_USERS>({
            sql: `SELECT first_name, last_name, username FROM users WHERE id = ? LIMIT 1`,
            values: [Number(user_id)],
        })
    ).payload?.[0];
    const computer = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_COMPUTERS>({
            sql: `SELECT name FROM computers WHERE id = ? LIMIT 1`,
            values: [Number(computer_id)],
        })
    ).payload?.[0];

    const bot_name = `${bot?.name || "A bot"} (bot ${Number(bot_id)})`;
    const user_name = [person?.first_name, person?.last_name].filter(Boolean).join(" ") || person?.username || `user ${Number(user_id)}`;
    const computer_name = `${computer?.name || "computer"} (#${Number(computer_id)})`;

    const now = Date.now();
    const inserted = await BunSQLite.insert<BUN_SQLITE_COBBLE_INSTALL_REQUESTS, (typeof BunSQLiteTables)[number]>({
        table: "install_requests",
        data: [
            {
                packages: JSON.stringify(packages),
                reason,
                status: "pending",
                user_id: Number(user_id),
                bot_id: Number(bot_id),
                session_id: Number(session_id),
                workspace_id: Number(workspace_id) || undefined,
                computer_id: Number(computer_id),
                created_at: now,
                updated_at: now,
            },
        ],
    });

    const request_id = Number(inserted.singleRes?.id || inserted.postInsertReturn?.insertId) || 0;

    if (!inserted.success || !request_id) throw new Error(`Couldn't record the install request: ${inserted.msg}`);

    const asked = installRequestAsked({ packages });
    const session = await ensureBotSession({ user_id: owner_id, bot_id: coordinator.id, workspace_id: null });
    const block = installRequestBlock({
        request_id,
        bot: bot_name,
        user: user_name,
        computer: computer_name,
        packages,
        reason,
        notes,
    });

    try {
        const job_id = await enqueueBotJob({
            user_id: owner_id,
            bot_id: coordinator.id,
            session_id: Number(session.id),
            title: `Install request #${request_id} from ${bot_name}: ${asked}`.slice(0, 200),
            instructions: `${block}\n\nWeigh this request as the install request rules say, install what you accept, check it took, and answer it with answer_install_request.`,
            params: { install_request_id: request_id },
            computer_id,
        });

        await BunSQLite.sql({
            sql: `UPDATE install_requests SET job_id = ?, updated_at = ? WHERE id = ?`,
            values: [Number(job_id), Date.now(), request_id],
        });

        await pushBotNotice({
            bot_id: coordinator.id,
            message: await insertBotMessage({
                bot_id: coordinator.id,
                session_id: Number(session.id),
                workspace_id: null,
                text: `${bot_name} asked me to install ${asked} on ${computer_name} (install request #${request_id}). I'll weigh it and answer.`,
            }),
        }).catch(() => undefined);

        wakeBotsQueue();

        return { request_id, job_id: Number(job_id) };
    } catch (error) {
        await BunSQLite.sql({
            sql: `UPDATE install_requests SET status = 'failed', answer = ?, decided_at = ?, updated_at = ? WHERE id = ?`,
            values: [`It couldn't be queued for the coordinator.`, Date.now(), Date.now(), request_id],
        });

        throw error;
    }
}
