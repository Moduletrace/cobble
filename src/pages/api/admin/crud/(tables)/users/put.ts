import type { AdminCrudAPIParams } from "@/src/types";
import BunSQLite from "@moduletrace/bun-sqlite";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import _ from "lodash";
import canUpdateUser from "@/src/utils/rbac/can-update-user";
import grabUserTypes from "@/src/functions/backend/db/users/grab-user-types";
import sanitizeUserBio from "@/src/functions/backend/db/users/sanitize-user-bio";
import { UserUpdatableFields } from "./(data)/user-updatable-fields";

export default async function (
    params: AdminCrudAPIParams,
): Promise<APIResponseObject> {
    const { table, body, user_types, id, user } = params;

    if (!body?.update_data) {
        return {
            success: false,
            msg: `No Update Data`,
        };
    }

    const update_data = sanitizeUserBio({
        user: _.pick(body.update_data, UserUpdatableFields),
    });
    const update_fields = Object.keys(update_data);

    if (!update_fields[0]) {
        return {
            success: false,
            msg: `No updatable fields passed`,
        };
    }

    const target_user_id = id || user.id;

    const target_user_types =
        String(target_user_id) === String(user.id)
            ? user_types
            : await grabUserTypes({ user_id: target_user_id });

    const can_update = canUpdateUser({
        actor_user_types: user_types,
        actor_user_id: user.id,
        target_user_id,
        target_user_types,
        update_fields,
    });

    if (!can_update) {
        return {
            success: false,
            msg: `Unauthorized`,
        };
    }

    const PUT = await BunSQLite.update({
        table,
        data: update_data,
        targetId: target_user_id,
    });

    return PUT;
}
