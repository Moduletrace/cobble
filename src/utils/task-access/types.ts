import type { CrewRole } from "../rbac/crew-role";

/**
 * A SQL condition with its values, to splice into a WHERE.
 */
export type SqlCondition = {
    sql: string;
    values: (string | number)[];
};

/**
 * One collection of tasks: a bot's own, or a workspace's shared one.
 */
export type TaskScope = {
    bot_id?: number | null;
    workspace_id?: number | null;
};

export type TaskScopeSqlParams = {
    role: CrewRole;
    user_id: number | string;
    /**
     * The table alias the condition reads.
     */
    alias?: string;
};
