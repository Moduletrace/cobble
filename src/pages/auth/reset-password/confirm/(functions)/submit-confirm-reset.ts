import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type useFormInit from "@/src/hooks/use-form-init";
import type { ApiReqParams, PasswordResetFormObject } from "@/src/types";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import validatePassword from "@/src/utils/validate-password";

export default async function submitConfirmReset({
    setLoading,
    setStatus,
    form,
}: ReturnType<typeof useFormInit<PasswordResetFormObject>>) {
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
        `/api/auth/reset-password`,
        {
            method: "POST",
            body: {
                sso_code: form.code?.trim(),
                new_password: form.new_password,
            },
        },
    );

    if (res.success) {
        window.location.pathname = `/admin`;
    } else {
        setStatus({
            error: true,
            msg: res.msg || "Couldn't reset your password. Please try again.",
        });
        setLoading(false);
    }
}
