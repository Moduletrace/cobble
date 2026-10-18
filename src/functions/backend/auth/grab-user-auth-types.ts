import type {
    BUN_SQLITE_COBBLE_USER_TYPES,
    BunSQLiteTables,
} from "@/db/types/db";
import type { UserAuthReturn } from "@/src/types";
import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    user_id: number | string;
};

export default async function grabUserAuthTypes({
    user_id,
}: Params): Promise<UserAuthReturn> {
    try {
        const user_types =
            (
                await BunSQLite.select<
                    BUN_SQLITE_COBBLE_USER_TYPES,
                    (typeof BunSQLiteTables)[number]
                >({
                    table: "user_types",
                    query: {
                        query: {
                            user_id: {
                                value: user_id,
                            },
                        },
                    },
                })
            ).payload || [];

        if (user_types.find((ty) => ty.user_type == "revoked")) {
            return {
                success: false,
                msg: "User Access Revoked",
            };
        }

        return {
            success: true,
            user_types,
        };
    } catch (error: any) {
        return {
            success: false,
            msg: error.message,
        };
    }
}
