import type { BUN_SQLITE_BSQLITE_USER_TYPES } from "@/db/types/db";

type Params = {
    user_types?: BUN_SQLITE_BSQLITE_USER_TYPES[] | null;
};

/**
 * Whether this is a `read_only` user
 */
export default function isReadOnlyUser({ user_types }: Params): boolean {
    return Boolean(user_types?.find((ty) => ty.user_type == "read_only"));
}
