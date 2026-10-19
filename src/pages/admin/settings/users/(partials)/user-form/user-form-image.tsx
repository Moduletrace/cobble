import ImageUpload from "@moduletrace/twui/form/ImageUpload";
import grabMediaURL from "@/src/functions/backend/media/grab-media-url";
import useFormInit from "@/src/hooks/use-form-init";
import type { UserFormObject } from "@/src/types";
import type { BUN_SQLITE_COBBLE_USERS_JOIN } from "@/src/types/sql-joins";

type Props = ReturnType<typeof useFormInit<UserFormObject>> & {
    person?: BUN_SQLITE_COBBLE_USERS_JOIN;
};

/**
 * Their profile photo, saved with the rest of the form.
 */
export default function UserFormImage({ person, setImage }: Props) {
    const user_image_url = person?.profile_media_id
        ? grabMediaURL({ media: { id: person.profile_media_id } }).media_url
        : undefined;

    return (
        <ImageUpload
            label="Photo"
            existingImageUrl={user_image_url}
            onChangeHandler={(imgData) => setImage(imgData)}
            restoreImageFn={() => setImage(undefined)}
        />
    );
}
