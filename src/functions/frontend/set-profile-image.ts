import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import type { SetProfileImageRequest } from "@/src/schemas/profile-image-schema";

/**
 * Sets or removes a bot's or workspace's picture.
 */
export default async function setProfileImage(body: SetProfileImageRequest) {
    return await fetchApi<SetProfileImageRequest, APIResponseObject<{ image_media_id: number | null }>>(
        `/api/admin/set-profile-image`,
        { method: "POST", body },
    );
}
