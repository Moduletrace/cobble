import BunSQLite from "@moduletrace/bun-sqlite";
import AppError from "@/src/utils/app-error";
import grabUserBot from "../bots/grab-user-bot";
import grabUserComputer from "./grab-user-computer";
import assertCrewManager from "@/src/functions/backend/db/access/assert-crew-manager";
import applyHostDirectoryGrant from "../host-directories/apply-host-directory-grant";
import grabComputerHostDirectoryIds from "../host-directories/grab-computer-host-directory-ids";
import reconcileComputerHostDirectories from "../host-directories/reconcile-computer-host-directories";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    computer_id: number | string;
};

/**
 * Gives one of the user's bots access to one of their computers. Adding a
 * bot that already has access is a no-op. A host directory linked to the
 * computer is mounted in the bot's own folder, so the computer is set up
 * again to give it one (`reconcileComputerHostDirectories`).
 */
export default async function addBotToComputer({
    user_id,
    bot_id,
    computer_id,
}: Params) {
    await assertCrewManager({ user_id });

    const bot = await grabUserBot({ bot_id, user_id });
    const computer = await grabUserComputer({ computer_id, user_id });

    if (!bot?.id || !computer?.id) {
        throw new AppError(`Bot or computer not found.`);
    }

    await BunSQLite.sql({
        sql: `INSERT OR IGNORE INTO bot_computers (bot_id, computer_id, created_at, updated_at) VALUES (?, ?, ?, ?)`,
        values: [bot.id, computer.id, Date.now(), Date.now()],
    });

    await reconcileComputerHostDirectories({ computer_id: Number(computer.id) });

    /**
     * It reaches the folders mounted on that computer now, so each gives it
     * access, as every bot there has it.
     */
    for (const host_directory_id of await grabComputerHostDirectoryIds({
        computer_id: Number(computer.id),
    })) {
        await applyHostDirectoryGrant({
            host_directory_id,
            retry: false,
        }).catch(() => {});
    }
}
