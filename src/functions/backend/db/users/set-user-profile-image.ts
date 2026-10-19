import bufferFromBase64 from "@/src/utils/buffer-from-base-64";
import deleteMedia from "../media/delete-media";
import uploadAndRecordMedia from "./media/upload-and-record-media";

type Params = {
    user_id: number;
    /**
     * The new photo as a base64 data URL.
     */
    data_url: string;
};

/**
 * Replaces a user's profile photo: their old one is deleted, then this one
 * stored as their primary `user-profile-image`. The caller checks the actor
 * may update this user.
 */
export default async function setUserProfileImage({ user_id, data_url }: Params) {
    const { buffer, ext } = await bufferFromBase64(data_url);

    await deleteMedia({ media_paradigm: "user-profile-image", user_id, can_delete_all_media: true });

    const res = await uploadAndRecordMedia({
        data: buffer,
        media_paradigms: ["user-profile-image"],
        media_type: "image",
        is_primary: true,
        update_on_duplicate: true,
        media_mime_type: ext,
        user: { id: user_id },
    });

    if (!res.success) {
        throw new Error(`Couldn't save the photo: ${res.msg}`);
    }
}
