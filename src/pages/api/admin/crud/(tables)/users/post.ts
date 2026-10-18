import checkUserAccess from "@/src/functions/backend/auth/check-user-access";
import sanitizeUserBio from "@/src/functions/backend/db/users/sanitize-user-bio";
import type { AdminCrudAPIParams } from "@/src/types";
import BunSQLite from "@moduletrace/bun-sqlite";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import _ from "lodash";
import { UserUpdatableFields } from "./(data)/user-updatable-fields";

export default async function (
    params: AdminCrudAPIParams,
): Promise<APIResponseObject> {
    const { table, body, user_types } = params;

    const is_user_allowed_to_post = checkUserAccess({
        includes: ["admin"],
        user_types,
    });

    if (!is_user_allowed_to_post.success) {
        return is_user_allowed_to_post;
    }

    const final_insert_data = (body?.insert_data || []).map((row) =>
        sanitizeUserBio({
            user: _.pick(row, UserUpdatableFields),
        }),
    );

    if (!final_insert_data[0]) {
        return {
            success: false,
            msg: `No data to insert`,
        };
    }

    const POST = await BunSQLite.insert({
        table,
        data: final_insert_data,
        update_on_duplicate: body?.update_on_duplicate,
    });

    return POST;
}
