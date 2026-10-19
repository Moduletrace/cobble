import BunSQLite from "@moduletrace/bun-sqlite";
import { AppData } from "@/src/data/app-data";
import { logError } from "@/src/functions/backend/logger";
import grabConnectedUserIds from "@/src/websocket/(functions)/grab-connected-user-ids";
import relayChangedBots from "./relay-changed-bots";
import relayNewBotMessages from "./relay-new-bot-messages";
import relayNewJobUpdates from "./relay-new-job-updates";
import type { LiveRelayCursor } from "./types";

/**
 * Keeps this process's sockets current with work done anywhere: every
 * `AppData.LiveRelayPollMs` it reads new bot messages, new job steps and
 * changed bots from the database and pushes them to their owners'
 * sockets here. The process that did the work pushes at once
 * (`pushBotNotice`); this catches the rest, e.g. a job run by another
 * server on the same database. Clients ignore what they already have.
 * Runs in every server process, ungated.
 */
export default async function liveRelay() {
    const latest = async (table: "bot_messages" | "bots_queue_updates") =>
        Number(
            (
                await BunSQLite.sql<{ id: number }>({
                    sql: `SELECT MAX(id) AS id FROM ${table}`,
                })
            ).payload?.[0]?.id,
        ) || 0;

    const cursor: LiveRelayCursor = {
        message_id: await latest("bot_messages"),
        update_id: await latest("bots_queue_updates"),
        bots_at: Date.now(),
    };

    let running = false;

    setInterval(async () => {
        if (running) return;

        running = true;

        try {
            const users = grabConnectedUserIds();
            const now = Date.now();

            cursor.message_id = await relayNewBotMessages({ after_id: cursor.message_id, users });
            cursor.update_id = await relayNewJobUpdates({ after_id: cursor.update_id, users });

            /**
             * Overlap one interval, so a change written in the same
             * millisecond as the last look isn't missed.
             */
            await relayChangedBots({ since: cursor.bots_at - AppData.LiveRelayPollMs, users });
            cursor.bots_at = now;
        } catch (error) {
            await logError({ title: `Live relay failed`, error }).catch(() => {});
        } finally {
            running = false;
        }
    }, AppData.LiveRelayPollMs);
}
