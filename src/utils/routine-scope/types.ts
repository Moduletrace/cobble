import type { SqlCondition } from "@/src/utils/task-access/types";

/**
 * The conversation a routines list belongs to: a bot's own chat (no
 * workspace), or that bot's conversation in one workspace.
 */
export type RoutineConversationScope = {
    bot_id: number | string;
    /**
     * Null or undefined for the bot's own chat. A workspace id keeps only
     * the routines running there.
     */
    workspace_id?: number | string | null;
};

export type RoutineScopeSqlParams = RoutineConversationScope & {
    /**
     * The table alias the condition reads.
     */
    alias?: string;
};

export type { SqlCondition };
