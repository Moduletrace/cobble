import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import type useFormInit from "@/src/hooks/use-form-init";
import type { UserFormObject } from "@/src/types";
import type { BUN_SQLITE_COBBLE_USERS_JOIN } from "@/src/types/sql-joins";

type Params = ReturnType<typeof useFormInit<UserFormObject>> & {
    onSaved?: (params: { person: BUN_SQLITE_COBBLE_USERS_JOIN; msg: string }) => void;
};

/**
 * Saves the user, with a newly picked photo, through `users/save-user`,
 * which checks every field and user type. Hands the saved user to
 * `onSaved`, else reloads or opens their page.
 */
export default async function submitUserForm({
    form,
    image,
    existing_full,
    loading,
    setLoading,
    setStatus,
    onSaved,
    app_context,
}: Params) {
    if (loading) return;

    if ((form.password || "") != (form.confirm_password || "")) {
        setStatus({ error: true, msg: "The passwords don't match." });
        return;
    }

    if (!window.confirm(existing_full?.id ? `Save changes to ${form.first_name || "this user"}?` : `Add ${form.first_name || "this user"}?`)) return;

    setLoading(true);

    const res = await postAdminApi<BUN_SQLITE_COBBLE_USERS_JOIN>({
        path: "users/save-user",
        body: {
            user_id: existing_full?.id || null,
            first_name: form.first_name,
            last_name: form.last_name,
            email: form.email,
            username: form.username,
            password: form.password,
            confirm_password: form.confirm_password,
            user_types: form.user_types,
            image: image?.imageBase64Full,
            /**
             * Only where the form offers them (`UserFormAccess`), so a
             * form without them never clears them.
             */
            ...(app_context.pageProps?.crew_bots
                ? { bot_ids: form.bot_ids || [], workspace_ids: form.workspace_ids || [] }
                : {}),
        },
    });

    setLoading(false);

    if (!res.success || !res.singleRes?.id) {
        setStatus({ error: true, msg: res.msg || "Couldn't save the user." });
        return;
    }

    if (onSaved) {
        onSaved({ person: res.singleRes, msg: res.msg || "Saved." });
    } else if (existing_full?.id) {
        window.location.reload();
    } else {
        window.location.pathname = `/admin/people/${res.singleRes.id}`;
    }
}
