import type { CrewAccessParams, SqlCondition } from "./types";

/**
 * The bots a user chats with in their own chat (outside a workspace): the
 * super admin all of them, an admin every worker, anyone else only the
 * workers assigned to them. The coordinator is the super admin's alone.
 */
export default function chatBotsSql({ role, user_id, alias = "b" }: CrewAccessParams): SqlCondition {
    if (role == "super_admin") return { sql: `1`, values: [] };
    if (role == "admin") return { sql: `${alias}.kind != 'coordinator'`, values: [] };

    return {
        sql: `(${alias}.kind != 'coordinator' AND ${alias}.id IN (SELECT bot_id FROM bot_users WHERE user_id = ?))`,
        values: [Number(user_id)],
    };
}
