import type { CrewRole } from "../rbac/crew-role";

/**
 * A SQL condition with its values, to splice into a WHERE.
 */
export type SqlCondition = {
    sql: string;
    values: (string | number)[];
};

export type CrewAccessParams = {
    role: CrewRole;
    user_id: number | string;
    /**
     * The table alias the condition reads.
     */
    alias?: string;
};
