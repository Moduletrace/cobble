import BunSQLite from "@moduletrace/bun-sqlite";
import attachToAllBots from "./attach-to-all-bots";
import type { BUN_SQLITE_COBBLE_CUSTOM_TOOLS, BunSQLiteTables } from "@/db/types/db";
import type { SaveCustomToolRequest } from "@/src/schemas/extension-schema";
import AppError from "@/src/utils/app-error";
import grabCustomTool from "./grab-custom-tool";

type Params = {
    /**
     * The super admin saving it (checked by the caller).
     */
    user_id: number | string;
    data: SaveCustomToolRequest;
};

/**
 * Adds or edits a custom tool and returns its id. Names are unique.
 */
export default async function saveCustomTool({ user_id, data }: Params) {
    const clash = (
        await BunSQLite.sql<{ id: number }>({
            sql: `SELECT id FROM custom_tools WHERE name = ? AND id != ?`,
            values: [data.name, data.custom_tool_id || 0],
        })
    ).payload?.[0];

    if (clash) throw new AppError(`Another tool is already called ${data.name}.`);

    const fields = {
        name: data.name,
        description: data.description,
        kind: data.kind,
        parameters: JSON.stringify(data.parameters),
        config: JSON.stringify(data.config),
        enabled: data.enabled ? 1 : 0,
        all_bots: data.all_bots ? 1 : 0,
        /**
         * Whatever its last run showed was about the old version.
         */
        status: "untested",
        last_error: "",
    } as const;

    if (data.custom_tool_id) {
        const tool = await grabCustomTool({ custom_tool_id: data.custom_tool_id });
        const res = await BunSQLite.update<BUN_SQLITE_COBBLE_CUSTOM_TOOLS, (typeof BunSQLiteTables)[number]>({
            table: "custom_tools",
            targetId: tool.id,
            data: fields,
        });

        if (!res.success) throw new Error(`Couldn't save the tool: ${res.msg}`);

        if (data.all_bots && !tool.all_bots) await attachToAllBots({ kind: "tool", id: tool.id });

        return tool.id;
    }

    const res = await BunSQLite.insert<BUN_SQLITE_COBBLE_CUSTOM_TOOLS, (typeof BunSQLiteTables)[number]>({
        table: "custom_tools",
        data: [{ ...fields, user_id: Number(user_id) }],
    });

    const id = res.singleRes?.id || res.postInsertReturn?.insertId;

    if (!res.success || !id) throw new Error(`Couldn't add the tool: ${res.msg}`);

    if (data.all_bots) await attachToAllBots({ kind: "tool", id: Number(id) });

    return Number(id);
}
