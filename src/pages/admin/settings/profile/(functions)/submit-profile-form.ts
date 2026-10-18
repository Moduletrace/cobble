import type { BUN_SQLITE_COBBLE_USERS } from "@/db/types/db";
import adminCrudHandler from "@/src/functions/frontend/admin-crud-handler";
import clientDeleteMediaHandler from "@/src/functions/frontend/client-delete-media-handler";
import clientUploadMediaHandler from "@/src/functions/frontend/client-upload-media-handler";
import type useFormInit from "@/src/hooks/use-form-init";
import type { UserFormObject } from "@/src/types";
import { ProfileFields } from "../(data)/profile-fields";

type Params = ReturnType<typeof useFormInit<UserFormObject>> & {
    onSaved: (params: {
        saved: UserFormObject;
        photo_src?: string;
        msg: string;
    }) => void;
};

/**
 * Saves the text fields, then the photo if a new one was picked. No reload:
 * `onSaved` hands back what is now stored. The success message goes through
 * `onSaved` too, since `useFormInit` clears `status` whenever the form
 * changes.
 */
export default async function submitProfileForm({
    setLoading,
    setStatus,
    form,
    existing_full,
    image,
    onSaved,
}: Params) {
    const user_id = existing_full?.id;

    if (!user_id) {
        return;
    }

    try {
        setLoading(true);
        setStatus({});

        const saved = Object.fromEntries(
            ProfileFields.map((field) => [
                field,
                String(form[field] ?? "").trim(),
            ]),
        ) as BUN_SQLITE_COBBLE_USERS;

        const update_user_res = await adminCrudHandler({
            action: "update",
            table: "users",
            update_data: saved,
            id: user_id,
        });

        if (!update_user_res.success) {
            throw new Error(
                update_user_res.msg || "Couldn't save your profile.",
            );
        }

        if (image?.imageBase64Full) {
            const delete_media_res = await clientDeleteMediaHandler({
                user_id,
                media_paradigm: "user-profile-image",
            });

            if (!delete_media_res.success) {
                throw new Error(
                    delete_media_res.msg || "Couldn't replace your photo.",
                );
            }

            const upload_image_res = await clientUploadMediaHandler({
                user_id,
                media_base_64_data_url: image.imageBase64Full,
                media_paradigms: ["user-profile-image"],
                media_type: "image",
                is_media_primary: true,
                update_on_duplicate: true,
                reauth: true,
            });

            if (!upload_image_res.success) {
                throw new Error(
                    upload_image_res.msg || "Couldn't upload your photo.",
                );
            }
        }

        onSaved({ saved, photo_src: image?.imageBase64Full, msg: "Saved." });
    } catch (error: any) {
        setStatus({
            error: true,
            msg: error.message || "Couldn't save your profile.",
        });
    } finally {
        setLoading(false);
    }
}
