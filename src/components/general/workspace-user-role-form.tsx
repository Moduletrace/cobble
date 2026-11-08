import { useState } from "react";
import Form from "@moduletrace/twui/form/Form";
import Textarea from "@moduletrace/twui/form/Textarea";
import { AppData } from "@/src/data/app-data";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import AddFormActions from "@/src/layouts/bots/(partials)/add-form-actions";

type Props = {
    workspace_id: number;
    workspace_name: string;
    user_id: number;
    person_name: string;
    /**
     * Their role there now.
     */
    role?: string | null;
    onCancel: () => void;
    /**
     * After the save, with the role as saved (null once cleared).
     */
    onSaved: (role: string | null) => void;
};

/**
 * The form for who a user is in one workspace
 * (`api/admin/workspaces/set-user-role`, crew managers). Emptied, it
 * clears the role. It asks first.
 */
export default function WorkspaceUserRoleForm({
    workspace_id,
    workspace_name,
    user_id,
    person_name,
    role: initial,
    onCancel,
    onSaved,
}: Props) {
    const [role, setRole] = useState(initial || "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();

    const submit = async () => {
        if (loading) return;

        const cleared = !role.trim();

        if (
            !window.confirm(
                cleared
                    ? `Clear ${person_name}'s role in ${workspace_name}?`
                    : `Save ${person_name}'s role in ${workspace_name}?`,
            )
        ) {
            return;
        }

        setLoading(true);
        setError(undefined);

        const res = await postAdminApi<{ role: string | null }>({
            path: "workspaces/set-user-role",
            body: { workspace_id, user_id, role },
        });

        setLoading(false);

        if (!res.success) {
            setError(res.msg || "Couldn't save.");
            return;
        }

        onSaved(res.singleRes?.role || null);
    };

    return (
        <Form className="w-full gap-4! items-stretch pt-4" onSubmit={submit}>
            <Textarea
                id={`workspace-user-role-${workspace_id}-${user_id}`}
                title="Their role here"
                label="Their role here"
                showLabel
                rows={6}
                maxLength={AppData.WorkspaceUserRoleMaxLength}
                placeholder="Head of sales. Wants numbers first and short answers; decides on pricing, not on the product."
                defaultValue={initial || ""}
                info={`Every bot here reads this when it works for ${person_name}, only in this workspace. ${person_name} doesn't see or change it. Leave it empty to clear it.`}
                onChange={(e) => setRole(e.target.value)}
            />
            <AddFormActions submit_label="Save" loading={loading} error={error} onCancel={onCancel} />
        </Form>
    );
}
