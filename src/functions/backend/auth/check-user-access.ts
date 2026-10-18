import type { BUN_SQLITE_BSQLITE_USER_TYPES } from "@/db/types/db";
import type { UserType } from "@/src/types";
import type { APIResponseObject } from "@moduletrace/bunext/types";

type Params = {
    includes?: UserType[];
    excludes?: UserType[];
    user_types?: BUN_SQLITE_BSQLITE_USER_TYPES[] | null;
};

export default function checkUserAccess({
    user_types,
    excludes,
    includes,
}: Params): APIResponseObject {
    if (!user_types?.[0]) {
        return {
            success: false,
            msg: `No User Types Provided`,
        };
    }

    if (user_types.find((t) => t.user_type === "super_admin")) {
        return {
            success: true,
        };
    }

    const userTypeSet = new Set(user_types.map((t) => t.user_type));

    if (excludes) {
        for (let i = 0; i < excludes.length; i++) {
            const exclude = excludes[i] as any;
            if (userTypeSet.has(exclude)) {
                return {
                    success: false,
                    msg: `User Excluded`,
                };
            }
        }
    }

    if (includes) {
        const is_user_included = includes.find((i) =>
            userTypeSet.has(i as any),
        );

        if (!is_user_included) {
            return {
                success: false,
                msg: `User not included`,
            };
        }
    }

    if (!includes?.[0] && !excludes?.[0]) {
        return {
            success: false,
            msg: `No includes or excludes provided`,
        };
    }

    return {
        success: true,
    };
}
