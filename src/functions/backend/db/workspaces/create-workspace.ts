import BunSQLite from "@moduletrace/bun-sqlite";
import type {
    BUN_SQLITE_COBBLE_WORKSPACES,
    BunSQLiteTables,
} from "@/db/types/db";
import assertPromptLength from "@/src/utils/assert-prompt-length";

type Params = {
    user_id: number | string;
    name: string;
    description?: string;
    system_prompt?: string;
};

/**
 * Creates a workspace owned by the user and returns its id.
 */
export default async function createWorkspace({
    user_id,
    name,
    description,
    system_prompt,
}: Params) {
    assertPromptLength({ label: "System prompt", text: system_prompt });

    const res = await BunSQLite.insert<
        BUN_SQLITE_COBBLE_WORKSPACES,
        (typeof BunSQLiteTables)[number]
    >({
        table: "workspaces",
        data: [
            {
                user_id: Number(user_id),
                name,
                description,
                system_prompt,
                archived: 0,
            },
        ],
    });

    const workspace_id = res.singleRes?.id || res.postInsertReturn?.insertId;

    if (!res.success || !workspace_id) {
        throw new Error(`Couldn't create the workspace: ${res.msg}`);
    }

    return workspace_id;
}
