import twuiNumberfy from "@moduletrace/twui/utils/numberfy";
import loginUser from "@/src/functions/backend/auth/login-user";
import userAuth from "@/src/functions/backend/auth/user-auth";
import uploadAndRecordMedia from "@/src/functions/backend/db/users/media/upload-and-record-media";
import type { ApiReqParams } from "@/src/types";
import bufferFromBase64 from "@/src/utils/buffer-from-base-64";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";
import _ from "lodash";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import canUpdateUser from "@/src/utils/rbac/can-update-user";
import grabUserTypes from "@/src/functions/backend/db/users/grab-user-types";

export const handler: BunextAPIRouteHandler<APIResponseObject> = async (
    params,
) => {
    const req = params.req;
    const body = params.body as ApiReqParams;

    if (req.method !== "POST") {
        return {
            success: false,
        };
    }

    const { user, user_types } = await userAuth({ req });

    if (!user?.logged_in_status) {
        return {
            success: false,
            msg: `Unauthorized`,
            logoutUser: true,
        };
    }

    try {
        const {
            user_id,
            media_base_64_data_url,
            media_paradigms,
            media_type,
            is_media_primary,
            update_on_duplicate,
            reauth,
            return_media_text_content,
            media,
            is_media_private,
            media_name,
        } = body;

        /**
         * Media is owned by the logged in user unless an actor with
         * permission to update the target user uploads on their behalf.
         */
        const target_user_id = user_id ? twuiNumberfy(user_id) : user.id;
        const is_self = String(target_user_id) === String(user.id);

        /**
         * `read_only` users cannot modify records, but they may still manage
         * their own profile image.
         */
        if (isReadOnlyUser({ user_types })) {
            const is_own_profile_image =
                is_self && media_paradigms?.includes("user-profile-image");

            if (!is_own_profile_image) {
                throw new Error(`This user can only read records.`);
            }
        }

        if (!is_self) {
            const target_user_types = await grabUserTypes({
                user_id: target_user_id,
            });

            const can_update_target = canUpdateUser({
                actor_user_types: user_types,
                actor_user_id: user.id,
                target_user_id,
                target_user_types,
            });

            if (!can_update_target) {
                throw new Error(`Operation not allowed!`);
            }
        }

        if (!media_base_64_data_url) {
            throw new Error(
                `No image payload sent! Base64 data URL with mime type is required.`,
            );
        }

        const { buffer, ext } = await bufferFromBase64(media_base_64_data_url);

        const new_media = await uploadAndRecordMedia({
            data: buffer,
            media_paradigms,
            media_type,
            is_primary: is_media_primary,
            update_on_duplicate,
            extract_media_text_content: return_media_text_content,
            media,
            media_mime_type: ext,
            user: { id: target_user_id },
            is_private: is_media_private,
            media_name,
        });

        if (reauth) {
            return await loginUser({
                user_id: Number(user.id),
            });
        }

        return {
            ...new_media,
        };
    } catch (error: any) {
        return {
            success: false,
            msg: error.message,
        };
    }
};
