import type { BUN_SQLITE_BSQLITE_ALL_TYPEDEFS } from "@/db/types/db";
import {
    RolesAdminCantUpdate,
    SuperAdminOnlyEditableUserTypes,
    UneditableUserTypes,
} from "@/src/dict/user-types-dict";
import checkUserAccess from "@/src/functions/backend/auth/check-user-access";
import type { AdminCrudAPIParams, UserType } from "@/src/types";
import BunSQLite from "@moduletrace/bun-sqlite";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import _ from "lodash";

export default async function (
    params: AdminCrudAPIParams,
): Promise<APIResponseObject> {
    const { table, user_types, body, id, query } = params;

    let final_sql_query = _.merge(query?.sql_query, body?.sql_query) || {};

    const records_to_delete =
        await BunSQLite.select<BUN_SQLITE_BSQLITE_ALL_TYPEDEFS>({
            table,
            query: final_sql_query,
            targetId: id,
        });

    if (!records_to_delete.payload?.[0]) {
        return {
            success: false,
            msg: `No Records to Delete`,
        };
    }

    const is_user_super_admin = checkUserAccess({
        user_types,
    });

    const admin_includes: UserType[] = ["admin"];

    const can_delete_user_type = checkUserAccess({
        user_types,
        includes: admin_includes,
    });

    const is_user_admin = Boolean(
        user_types.find(
            (ut) => ut.user_type && admin_includes.includes(ut.user_type as any),
        ),
    );

    if (!can_delete_user_type.success) {
        return can_delete_user_type;
    }

    const ignored_user_types = [...UneditableUserTypes] as UserType[];

    if (!is_user_super_admin.success) {
        ignored_user_types.push(...SuperAdminOnlyEditableUserTypes);
    }

    const user_types_to_delete = records_to_delete.payload.filter(
        (rec) => !ignored_user_types.includes(rec.user_type as any),
    );

    for (let i = 0; i < user_types_to_delete.length; i++) {
        const user_type_to_delete = user_types_to_delete[i];

        if (!user_type_to_delete?.id) continue;

        if (
            is_user_admin &&
            user_type_to_delete.user_type &&
            RolesAdminCantUpdate.includes(user_type_to_delete.user_type as any)
        ) {
            continue;
        }

        await BunSQLite.delete({
            table,
            targetId: user_type_to_delete.id,
        });
    }

    return {
        success: true,
    };
}
