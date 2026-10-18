import type { BUN_SQLITE_BSQLITE_USER_TYPES } from "@/db/types/db";

type Params = {
    user_types?: BUN_SQLITE_BSQLITE_USER_TYPES[] | null;
};

/**
 * Pass-through actors that bypass the assignment matrix: `super_admin`.
 */
export default function isPassThroughUser({ user_types }: Params): boolean {
    return Boolean(
        user_types?.find((ut) => ut.user_type === "super_admin"),
    );
}