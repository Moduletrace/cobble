import BunSQLite from "@moduletrace/bun-sqlite";
import type { BotWithFace } from "@/src/types";
import botFaceSql from "@/src/utils/bot-face-sql";
import type {
    BUN_SQLITE_COBBLE_WORKSPACES,
} from "@/db/types/db";

type Params = {
    computer_id: number | string;
    /**
     * Whose faces the bots show.
     */
    user_id: number | string;
};

export type ComputerAccess = {
    bots: BotWithFace[];
    workspaces: BUN_SQLITE_COBBLE_WORKSPACES[];
};

/**
 * Who reaches a computer: the bots with direct access and the workspaces
 * linked to it. The caller has already checked the user sees the
 * computer.
 */
export default async function grabComputerAccess({
    computer_id,
    user_id,
}: Params): Promise<ComputerAccess> {
    const face = botFaceSql({ user_id });

    const [bots, workspaces] = await Promise.all([
        BunSQLite.sql<BotWithFace>({
            sql: `SELECT b.*, ${face.sql} FROM bots b
                JOIN bot_computers bc ON bc.bot_id = b.id
                WHERE bc.computer_id = ?
                ORDER BY b.kind = 'coordinator' DESC, b.name COLLATE NOCASE ASC, b.id ASC`,
            values: [...face.values, computer_id],
        }),
        BunSQLite.sql<BUN_SQLITE_COBBLE_WORKSPACES>({
            sql: `SELECT w.* FROM workspaces w
                JOIN workspace_computers wc ON wc.workspace_id = w.id
                WHERE wc.computer_id = ? AND w.archived = 0
                ORDER BY w.name COLLATE NOCASE ASC, w.id ASC`,
            values: [computer_id],
        }),
    ]);

    return {
        bots: bots.payload || [],
        workspaces: workspaces.payload || [],
    };
}
