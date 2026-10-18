import type { BUN_SQLITE_COBBLE_USERS } from "@/db/types/db";
import adminCrudHandler from "@/src/functions/frontend/admin-crud-handler";
import clientDeleteMediaHandler from "@/src/functions/frontend/client-delete-media-handler";
import clientUploadMediaHandler from "@/src/functions/frontend/client-upload-media-handler";
import type useFormInit from "@/src/hooks/use-form-init";
import type { UserFormObject } from "@/src/types";
import _ from "lodash";

export default async function submitAccountForm({
    setLoading,
    setStatus,
    form,
    existing_full,
    image,
}: ReturnType<typeof useFormInit<UserFormObject>>) {
    try {
        const user_id = existing_full?.id;

        if (!user_id) {
            return;
        }

        if (!window.confirm("Update your account details?")) {
            return;
        }

        const new_user_data: BUN_SQLITE_COBBLE_USERS = _.pick<
            UserFormObject,
            keyof UserFormObject
        >(form, ["first_name", "last_name", "email", "username", "bio"]);

        setLoading(true);

        const update_user_res = await adminCrudHandler({
            action: "update",
            table: "users",
            update_data: new_user_data,
            id: user_id,
        });

        if (!update_user_res.success) {
            throw new Error(update_user_res.msg || "Account Update Failed");
        }

        if (image?.imageBase64Full) {
            const delete_media_res = await clientDeleteMediaHandler({
                user_id: user_id,
                media_paradigm: "user-profile-image",
            });

            if (!delete_media_res.success) {
                throw new Error(
                    delete_media_res.msg ||
                        delete_media_res.error ||
                        `Couldn't delete old media`,
                );
            }

            const upload_image_res = await clientUploadMediaHandler({
                user_id: user_id,
                media_base_64_data_url: image.imageBase64Full,
                media_paradigms: ["user-profile-image"],
                media_type: "image",
                is_media_primary: true,
                update_on_duplicate: true,
                reauth: true,
            });

            if (!upload_image_res.success) {
                throw new Error(
                    upload_image_res.msg || "Couldn't upload Image",
                );
            }
        }

        window.location.reload();
    } catch (error: any) {
        setStatus({
            error: true,
            msg: error.message || "Account Form Error",
        });

        setLoading(false);
    }
}