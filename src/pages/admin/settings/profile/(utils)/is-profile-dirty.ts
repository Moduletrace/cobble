import type { UserFormObject } from "@/src/types";
import type { ImageInputToBase64FunctionReturn } from "@moduletrace/twui/utils/form/imageInputToBase64";
import { ProfileFields } from "../(data)/profile-fields";

type Params = {
    form: UserFormObject;
    existing: UserFormObject;
    image?: ImageInputToBase64FunctionReturn;
};

/**
 * Whether the profile form differs from what is saved: a new photo, or any
 * text field changed (ignoring surrounding spaces).
 */
export default function isProfileDirty({ form, existing, image }: Params) {
    if (image?.imageBase64Full) {
        return true;
    }

    return ProfileFields.some(
        (field) =>
            String(form[field] ?? "").trim() !=
            String(existing[field] ?? "").trim(),
    );
}
