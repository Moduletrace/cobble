import { UserTypes } from "@/src/dict/user-types-dict";
import type { UserType } from "@/src/types";

type Params = {
    /**
     * The user's types, comma separated (`grabUsers`' `user_types`).
     */
    user_types?: string | null;
};

/**
 * A user's types as a list, only the ones `UserTypes` defines.
 */
export default function parseUserTypes({ user_types }: Params): UserType[] {
    const values = (user_types || "").split(",").map((type) => type.trim());

    return UserTypes.map((type) => type.value).filter((type) => values.includes(type));
}
