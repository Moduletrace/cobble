import BunSQLite from "@moduletrace/bun-sqlite";
import { AppData } from "@/src/data/app-data";

type Params = {
    ask_id: number | string;
};

/**
 * The asks one ask was asked from, newest first, walking
 * `parent_ask_id` up to the depth cap (a cycle stops it too). A bot already
 * in the chain can't be asked again: it is waiting on the answer itself.
 */
export default async function askAncestry({ ask_id }: Params): Promise<number[]> {
    const chain: number[] = [];
    let current = Number(ask_id) || 0;

    while (current && chain.length <= AppData.AskMaxDepth) {
        if (chain.includes(current)) break;

        chain.push(current);

        const res = await BunSQLite.sql<{ parent_ask_id: number | null }>({
            sql: `SELECT parent_ask_id FROM bot_asks WHERE id = ?`,
            values: [current],
        });

        current = Number(res.payload?.[0]?.parent_ask_id) || 0;
    }

    return chain;
}
