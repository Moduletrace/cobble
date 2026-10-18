import BunSQLite from "@moduletrace/bun-sqlite";
import type {
    BUN_SQLITE_COBBLE_WORKSPACES,
    BunSQLiteTables,
} from "@/db/types/db";
import AppError from "@/src/utils/app-error";
import assertPromptLength from "@/src/utils/assert-prompt-length";
import grabUserWorkspace from "./grab-user-workspace";
import _ from "lodash";

type Params = {
    user_id: number | string;
    workspace_id: number | string;
    /**
     * Only the fields given are changed.
     */
    data: Pick<
        BUN_SQLITE_COBBLE_WORKSPACES,
        "name" | "description" | "system_prompt" | "archived"
    >;
};

/**
 * Updates one of the user's workspaces. Its `system_prompt` is shared
 * context for every bot in it.
 */
export default async function updateWorkspace({
    user_id,
    workspace_id,
    data,
}: Params) {
    assertPromptLength({ label: "System prompt", text: data.system_prompt });

    const workspace = await grabUserWorkspace({ workspace_id, user_id });

    if (!workspace?.id) {
        throw new AppError(`Workspace not found.`);
    }

    const res = await BunSQLite.update<
        BUN_SQLITE_COBBLE_WORKSPACES,
        (typeof BunSQLiteTables)[number]
    >({
        table: "workspaces",
        targetId: workspace.id,
        /**
         * `BunSQLite.update` writes every key it gets, so a field left out
         * here would be set to null.
         */
        data: _.omitBy(
            {
                name: data.name,
                description: data.description,
                system_prompt: data.system_prompt,
                archived: data.archived,
            },
            _.isUndefined,
        ),
    });

    if (!res.success) {
        throw new Error(`Couldn't update the workspace: ${res.msg}`);
    }
}
