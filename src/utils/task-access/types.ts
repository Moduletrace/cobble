import type { CrewRole } from "../rbac/crew-role";

/**
 * A SQL condition with its values, to splice into a WHERE.
 */
export type SqlCondition = {
    sql: string;
    values: (string | number)[];
};

/**
 * Where a task is: a bot's own list (`bot_id` alone), or a workspace
 * (`workspace_id`, with the `bot_id` that has it there). Every task has a
 * bot.
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
