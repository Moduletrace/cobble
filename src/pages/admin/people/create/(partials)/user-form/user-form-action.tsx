import useFormInit from "@/src/hooks/use-form-init";
import AddFormActions from "@/src/layouts/bots/(partials)/add-form-actions";
import type { UserFormObject } from "@/src/types";

type Props = ReturnType<typeof useFormInit<UserFormObject>> & {
    onCancel?: () => void;
};

export default function UserFormAction({ existing_full, loading, status, onCancel }: Props) {
    return (
        <AddFormActions
            submit_label={existing_full?.id ? "Save" : "Add user"}
            loading={loading}
            error={status?.error ? status.msg : undefined}
            onCancel={onCancel || (() => window.history.back())}
        />
    );
}
