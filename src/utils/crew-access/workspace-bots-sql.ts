import type { CrewAccessParams, SqlCondition } from "./types";

type Params = Pick<CrewAccessParams, "role" | "alias"> & {
    workspace_id: number | string;
};

/**
 * The bots of one workspace a user chats with there (check the user is in
 * the workspace first, `workspacesSql`): its workers, plus for the super
 * admin the coordinator, which works in every workspace.
 */
export default function workspaceBotsSql({ role, workspace_id, alias = "b" }: Params): SqlCondition {
    const members = `${alias}.id IN (SELECT bot_id FROM workspace_bots WHERE workspace_id = ?)`;

    if (role == "super_admin") {
        return { sql: `(${alias}.kind = 'coordinator' OR ${members})`, values: [Number(workspace_id)] };
    }

    return { sql: `(${alias}.kind != 'coordinator' AND ${members})`, values: [Number(workspace_id)] };
}
