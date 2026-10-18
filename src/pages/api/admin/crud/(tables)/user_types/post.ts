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
    const { table, body, user_types } = params;

    const is_user_super_admin = checkUserAccess({
        user_types,
    });

    const ignored_user_types = [...UneditableUserTypes] as UserType[];

    if (!is_user_super_admin.success) {
        ignored_user_types.push(...SuperAdminOnlyEditableUserTypes);
    }

    let final_insert_data = [...(body?.insert_data || [])].filter(
        (i) => !ignored_user_types.includes(i.user_type as any),
    );

    const admin_includes: UserType[] = ["admin"];

    const is_user_allowed_to_post = checkUserAccess({
        includes: admin_includes,
        user_types,
    });

    if (!is_user_allowed_to_post.success) {
        return is_user_allowed_to_post;
    }

    const is_user_admin = Boolean(
        user_types.find(
            (ut) => ut.user_type && admin_includes.includes(ut.user_type as any),
        ),
    );

    if (is_user_admin) {
        final_insert_data = final_insert_data.filter(
            (d) => d.user_type && !RolesAdminCantUpdate.includes(d.user_type as any),
        );
    }

    const POST = await BunSQLite.insert({
        table,
        data: final_insert_data,
        update_on_duplicate: body?.update_on_duplicate,
    });

    return POST;
}
