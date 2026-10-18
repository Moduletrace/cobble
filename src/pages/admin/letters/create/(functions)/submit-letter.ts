import type { BUN_SQLITE_BSQLITE_LETTERS } from "@/db/types/db";
import adminCrudHandler from "@/src/functions/frontend/admin-crud-handler";
import type useFormInit from "@/src/hooks/use-form-init";
import _ from "lodash";

export default async function submitLetter({
    setLoading,
    setStatus,
    form,
    existing_full,
    clearLocalForm,
}: ReturnType<typeof useFormInit<BUN_SQLITE_BSQLITE_LETTERS>>) {
    try {
        if (!form.title?.trim()) {
            throw new Error(`Please provide a letter title`);
        }

        const confirm_msg = existing_full?.id
            ? `Update this letter?`
            : `Create new letter?`;

        if (!window.confirm(confirm_msg)) {
            return;
        }

        const new_letter_data = _.pick<
            BUN_SQLITE_BSQLITE_LETTERS,
            keyof BUN_SQLITE_BSQLITE_LETTERS
        >(form, [
            "title",
            "to_name",
            "to_address",
            "from_name",
            "from_address",
            "subject",
            "salutation",
            "body_html",
            "closing",
            "signature_name",
            "signature_title",
        ]);

        setLoading(true);

        const create_or_update_res = await adminCrudHandler({
            action: existing_full?.id ? "update" : "insert",
            table: "letters",
            insert_data: [new_letter_data],
            update_data: new_letter_data,
            id: existing_full?.id,
        });

        if (!create_or_update_res.success) {
            throw new Error(
                create_or_update_res.msg || "Letter Save Failed",
            );
        }

        clearLocalForm();

        if (existing_full?.id) {
            window.location.reload();
        } else {
            window.location.pathname = "/admin/letters";
        }
    } catch (error: any) {
        setStatus({
            error: true,
            msg: error.message || "Letter Form Error",
        });

        setLoading(false);
    }
}