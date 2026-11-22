import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_CONNECTORS } from "@/db/types/db";
import AppError from "@/src/utils/app-error";
import parseConnectorRow from "./parse-connector-row";

type Params = {
    connector_id: number | string;
};

/**
 * One connector, wherever it's attached.
 */
export default async function grabConnector({ connector_id }: Params) {
    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_CONNECTORS>({
        sql: `SELECT * FROM connectors WHERE id = ? LIMIT 1`,
        values: [Number(connector_id)],
    });

    const row = res.payload?.[0];

    if (!row) throw new AppError(`That connector doesn't exist.`);

    return parseConnectorRow({ row });
}