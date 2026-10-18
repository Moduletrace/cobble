import type { BUN_SQLITE_COBBLE_BOT_COMPUTERS } from "@/db/types/db";
import type { AdminCrudAPIParams } from "@/src/types";
import isLockedComputerAccess from "@/src/utils/is-locked-computer-access";
import BunSQLite from "@moduletrace/bun-sqlite";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import _ from "lodash";

type AccessRow = BUN_SQLITE_COBBLE_BOT_COMPUTERS & {
    bot_kind?: string;
    computer_kind?: string;
};

/**
 * Deletes the matching access rows, skipping the coordinator's access to
 * the main computer.
 */
export default async function (
    params: AdminCrudAPIParams,
): Promise<APIResponseObject> {
    const { table, body, id, query } = params;

    const records_to_delete =
        await BunSQLite.select<BUN_SQLITE_COBBLE_BOT_COMPUTERS>({
            table,
            query: _.merge(query?.sql_query, body?.sql_query) || {},
            targetId: id,
        });

    if (!records_to_delete.payload?.[0]) {
        return {
            success: false,
            msg: `No Records to Delete`,
        };
    }

    let skipped = 0;

    for (let i = 0; i < records_to_delete.payload.length; i++) {
        const record = records_to_delete.payload[i];

        if (!record?.id) continue;

        const access = (
            await BunSQLite.sql<AccessRow>({
                sql: `SELECT bc.id, b.kind AS bot_kind, c.kind AS computer_kind FROM bot_computers bc JOIN bots b ON b.id = bc.bot_id JOIN computers c ON c.id = bc.computer_id WHERE bc.id = ? LIMIT 1`,
                values: [record.id],
            })
        ).payload?.[0];

        if (
            isLockedComputerAccess({
                bot_kind: access?.bot_kind,
                computer_kind: access?.computer_kind,
            })
        ) {
            skipped++;
            continue;
        }

        await BunSQLite.delete({
            table,
            targetId: record.id,
        });
    }

    return {
        success: true,
        msg: skipped
            ? `The coordinator always has access to the main computer.`
            : undefined,
    };
}
