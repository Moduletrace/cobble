import type {
    BUN_SQLITE_BSQLITE_USER_TYPES,
    BUN_SQLITE_BSQLITE_USERS,
} from "@/db/types/db";
import adminCrudHandler from "@/src/functions/frontend/admin-crud-handler";
import clientDeleteMediaHandler from "@/src/functions/frontend/client-delete-media-handler";
import clientUploadMediaHandler from "@/src/functions/frontend/client-upload-media-handler";
import type useFormInit from "@/src/hooks/use-form-init";
import type { UserFormObject } from "@/src/types";
import _ from "lodash";

export default async function submitUserForm({
    setLoading,
    setStatus,
    form,
    existing_full,
    existing,
    image,
}: ReturnType<typeof useFormInit<UserFormObject>>) {
    try {
        const confirm_msg = existing_full?.id
            ? `Update this user?`
            : `Create new user?`;

        if (!window.confirm(confirm_msg)) {
            return;
        }

        const new_user_data: BUN_SQLITE_BSQLITE_USERS = _.pick<
            UserFormObject,
            keyof UserFormObject
        >(form, ["first_name", "last_name", "email", "username", "bio"]);

        setLoading(true);

        const create_or_update_user_res = await adminCrudHandler({
            action: existing_full?.id ? "update" : "insert",
            table: "users",
            insert_data: [new_user_data],
            update_data: new_user_data,
            id: existing_full?.id,
        });

        const target_user_id =
            existing_full?.id || create_or_update_user_res.singleRes?.id;

        if (image?.imageBase64Full) {
            const is_user_settings =
                window.location.pathname.includes("admin/settings");

            const delete_media_res = await clientDeleteMediaHandler({
                user_id: target_user_id,
                media_paradigm: "user-profile-image",
            });

            if (!delete_media_res.success) {
                console.log("delete_media_res", delete_media_res);

                throw new Error(
                    delete_media_res.msg ||
                        delete_media_res.error ||
                        `Couldn't delete old media`,
                );
            }

            const upload_image_res = await clientUploadMediaHandler({
                user_id: target_user_id,
                media_base_64_data_url: image.imageBase64Full,
                media_paradigms: ["user-profile-image"],
                media_type: "image",
                is_media_primary: true,
                update_on_duplicate: true,
                reauth: is_user_settings,
            });

            console.log("upload_image_res", upload_image_res);

            if (!upload_image_res.success) {
                throw new Error(
                    upload_image_res.msg || "Couldn't upload Image",
                );
            }
        }

        if (create_or_update_user_res.success && target_user_id) {
            const delete_user_types = await adminCrudHandler({
                action: "delete",
                table: "user_types",
                sql_query: {
                    query: {
                        user_id: {
                            value: target_user_id,
                        },
                    },
                },
            });

            const user_types = form.user_types;

            if (user_types?.[0]) {
                const add_user_types =
                    await adminCrudHandler<BUN_SQLITE_BSQLITE_USER_TYPES>({
                        action: "insert",
                        table: "user_types",
                        insert_data: user_types.map((ut) => ({
                            user_id: target_user_id,
                            user_type: ut,
                        })),
                    });

                if (existing_full?.id) {
                    window.location.reload();
                } else {
                    window.location.pathname = `/admin/people/${target_user_id}`;
                }
            }
        } else {
            console.log("res", create_or_update_user_res);
            console.log("form", form);

            throw new Error(
                create_or_update_user_res.msg || "Person Creation Failed",
            );
        }
    } catch (error: any) {
        setStatus({
            error: true,
            msg: error.message || "User Form Error",
        });

        setLoading(false);
    }
}
