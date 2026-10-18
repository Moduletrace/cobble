import ImageUpload from "@moduletrace/twui/form/ImageUpload";
import grabMediaURL from "@/src/functions/backend/media/grab-media-url";
import useFormInit from "@/src/hooks/use-form-init";
import type { UserFormObject } from "@/src/types";
import type { BUN_SQLITE_BSQLITE_USERS_JOIN } from "@/src/types/sql-joins";

export default function UserFormImage({
    setForm,
    existing_full,
    setImage,
}: ReturnType<typeof useFormInit<UserFormObject>>) {
    const title = existing_full?.id ? "Update User" : "Create New User";

    const person = existing_full as BUN_SQLITE_BSQLITE_USERS_JOIN | undefined;

    const user_image_url = person?.profile_media_id
        ? grabMediaURL({
              media: { id: person?.profile_media_id },
          })
        : undefined;

    return (
        <>
            <ImageUpload
                label="User Image"
                existingImageUrl={user_image_url?.media_url}
                onChangeHandler={(imgData) => {
                    setImage(imgData);
                }}
                setImgURL={(imgURL) => {
                    if (
                        typeof imgURL !== "string" &&
                        typeof imgURL !== "undefined"
                    ) {
                        return;
                    }

                    setForm((prev) => ({
                        ...prev,
                        image: imgURL || "",
                        image_thumbnail: imgURL || "",
                    }));
                }}
                restoreImageFn={() => {
                    setForm((prev) => ({
                        ...prev,
                        image: user_image_url || "",
                        image_thumbnail: user_image_url || "",
                    }));
                }}
            />
        </>
    );
}
