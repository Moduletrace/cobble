import type { BUN_SQLITE_COBBLE_USERS } from "@/db/types/db";
import type { User } from "../types";

type Params = {
    first_name?: string | null;
    last_name?: string | null;
};

/**
 * A user's initials for their avatar, e.g. "AB".
 */
export default function userInitials(
    params?: User | BUN_SQLITE_COBBLE_USERS | null,
) {
    if (!params?.first_name) {
        return "NA";
    }

    const { first_name, last_name } = params;

    return [first_name, last_name]
        .filter(Boolean)
        .map((part) => part!.charAt(0).toUpperCase())
        .join("");
}
