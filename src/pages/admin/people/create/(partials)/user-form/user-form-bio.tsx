import type { BUN_SQLITE_BSQLITE_USERS } from "@/db/types/db";
import TinyMCEEditor from "@moduletrace/twui/editors/TinyMCE";
import Button from "@moduletrace/twui/layout/Button";
import useFormInit from "@/src/hooks/use-form-init";

export default function UserFormBio({
    setForm,
    existing,
    existing_full,
    form,
}: ReturnType<typeof useFormInit<BUN_SQLITE_BSQLITE_USERS>>) {
    const title = existing_full?.id ? "Update User" : "Create New User";

    return (
        <>
            <TinyMCEEditor
                defaultValue={form.bio}
                changeHandler={(content) => {
                    setForm((prev) => ({
                        ...prev,
                        bio: content,
                    }));
                }}
                placeholder="Write Something about yourself"
                options={{ height: 300 }}
                name="Bio"
                showLabel
            />
        </>
    );
}
