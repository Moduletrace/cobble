import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_KNOWLEDGEBASES, BunSQLiteTables } from "@/db/types/db";
import type { SaveKnowledgebaseRequest } from "@/src/schemas/knowledgebase-schema";
import attachToAllBots from "../extensions/attach-to-all-bots";
import grabKnowledgebase from "./grab-knowledgebase";

type Params = {
    /**
     * The super admin saving it (checked by the caller).
     */
    user_id: number | string;
    data: SaveKnowledgebaseRequest;
};

/**
 * Adds or edits a knowledgebase (its name, what it holds, on or off, every
 * bot) and returns its id. Its documents are added on their own.
 */
export default async function saveKnowledgebase({ user_id, data }: Params) {
    const fields = {
        name: data.name,
        description: data.description,
        enabled: data.enabled ? 1 : 0,
        all_bots: data.all_bots ? 1 : 0,
    } as const;

    if (data.knowledgebase_id) {
        const knowledgebase = await grabKnowledgebase({ knowledgebase_id: data.knowledgebase_id });

        const res = await BunSQLite.update<BUN_SQLITE_COBBLE_KNOWLEDGEBASES, (typeof BunSQLiteTables)[number]>({
            table: "knowledgebases",
            targetId: knowledgebase.id,
            data: fields,
        });

        if (!res.success) throw new Error(`Couldn't save the knowledgebase: ${res.msg}`);

        if (data.all_bots && !knowledgebase.all_bots) {
            await attachToAllBots({ kind: "knowledgebase", id: knowledgebase.id });
        }

        return knowledgebase.id;
    }

    const res = await BunSQLite.insert<BUN_SQLITE_COBBLE_KNOWLEDGEBASES, (typeof BunSQLiteTables)[number]>({
        table: "knowledgebases",
        data: [{ ...fields, user_id: Number(user_id) }],
    });

    const id = res.singleRes?.id || res.postInsertReturn?.insertId;

    if (!res.success || !id) throw new Error(`Couldn't add the knowledgebase: ${res.msg}`);

    if (data.all_bots) await attachToAllBots({ kind: "knowledgebase", id: Number(id) });

    return Number(id);
}
