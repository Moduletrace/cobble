import useFormInit from "@/src/hooks/use-form-init";
import AddFormActions from "@/src/layouts/bots/(partials)/add-form-actions";
import type { UserFormObject } from "@/src/types";

type Props = ReturnType<typeof useFormInit<UserFormObject>> & {
    onCancel?: () => void;
    /**
     * On a settings page, where there is nothing to cancel into.
     */
    hide_cancel?: boolean;
};

export default function UserFormAction({
    existing_full,
    loading,
    status,
    onCancel,
    hide_cancel,
}: Props) {
    return (
        <AddFormActions
            submit_label={existing_full?.id ? "Save" : "Add user"}
            loading={loading}
            error={status?.error ? status.msg : undefined}
            onCancel={
                hide_cancel
                    ? undefined
                    : onCancel || (() => window.history.back())
            }
        />
    );
}
