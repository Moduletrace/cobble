import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_CONTAINERS } from "@/db/types/db";
import removeDockerContainer from "@/src/functions/backend/docker/remove-docker-container";
import AppError from "@/src/utils/app-error";
import grabUserComputer from "./grab-user-computer";

type Params = {
    user_id: number | string;
    computer_id: number | string;
};

/**
 * Deletes one of the user's computers: removes its container and its
 * records (its access grants and workspace links go with them). Its home
 * directory is kept, so what it left stays on disk. Workspaces it was the
 * default of fall back to their oldest computer still linked. The main
 * computer can't be deleted.
 */
export default async function deleteComputer({ user_id, computer_id }: Params) {
    const computer = await grabUserComputer({ computer_id, user_id });

    if (!computer?.id) {
        throw new AppError(`Computer not found.`);
    }

    if (computer.kind == "main") {
        throw new AppError(`The main computer can't be deleted.`);
    }

    const container = computer.container_id
        ? (
              await BunSQLite.sql<BUN_SQLITE_COBBLE_CONTAINERS>({
                  sql: `SELECT * FROM containers WHERE id = ? LIMIT 1`,
                  values: [computer.container_id],
              })
          ).payload?.[0]
        : null;

    if (container?.docker_id || container?.name) {
        await removeDockerContainer({ container: container.docker_id || container.name! });
    }

    await BunSQLite.sql({ sql: `DELETE FROM computers WHERE id = ?`, values: [computer.id] });

    if (container?.id) {
        await BunSQLite.sql({ sql: `DELETE FROM containers WHERE id = ?`, values: [container.id] });
    }

    await BunSQLite.sql({
        sql: `UPDATE workspaces SET updated_at = ?, computer_id = (
            SELECT wc.computer_id FROM workspace_computers wc WHERE wc.workspace_id = workspaces.id ORDER BY wc.id ASC LIMIT 1
        ) WHERE computer_id = ?`,
        values: [Date.now(), computer.id],
    });

    return computer;
}
