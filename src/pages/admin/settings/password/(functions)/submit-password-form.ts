import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type useFormInit from "@/src/hooks/use-form-init";
import type { ApiReqParams, PasswordFormObject } from "@/src/types";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import validatePassword from "@/src/utils/validate-password";

type Params = ReturnType<typeof useFormInit<PasswordFormObject>> & {
    has_password: boolean;
    onDone: (params: { has_password: boolean }) => void;
};

export default async function submitPasswordForm({
    form,
    setLoading,
    setStatus,
    has_password,
    onDone,
}: Params) {
    if (has_password && !form.current_password) {
        setStatus({ error: true, msg: "Enter your current password." });
        return;
    }

    const password_error = validatePassword({ password: form.new_password });

    if (password_error) {
        setStatus({ error: true, msg: password_error });
        return;
    }

    if (form.new_password != form.confirm_password) {
        setStatus({ error: true, msg: "The passwords don't match." });
        return;
    }

    setLoading(true);

    const res = await fetchApi<ApiReqParams, APIResponseObject>(
        `/api/admin/settings/update-password`,
        {
            method: "POST",
            body: {
                password_update: {
                    current_password: form.current_password,
                    new_password: form.new_password,
                },
            },
        },
    );

    setLoading(false);

    if (!res.success) {
        setStatus({
            error: true,
            msg: res.msg || "Couldn't update your password.",
        });
        return;
    }

    setStatus({ success: true, msg: res.msg || "Password saved." });
    onDone({ has_password: true });
}
