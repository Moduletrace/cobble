import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type useFormInit from "@/src/hooks/use-form-init";
import type { ApiReqParams, LoginFormObject, LoginMethod } from "@/src/types";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import saveSSOPendingLogin from "@/src/functions/frontend/save-sso-pending-login";

type Params = ReturnType<typeof useFormInit<LoginFormObject>> & {
    method: LoginMethod;
};

export default async function submitLoginForm({
    setLoading,
    setStatus,
    form,
    method,
}: Params) {
    setLoading(true);

    const identifier = form.username_or_email?.trim() || "";

    const res = await fetchApi<ApiReqParams, APIResponseObject>(
        method == "password"
            ? `/api/auth/password-login`
            : `/api/auth/get-login-code`,
        {
            method: "POST",
            body: {
                login: {
                    email_or_username: identifier,
                    password: method == "password" ? form.password : undefined,
                },
            },
        },
    );

    if (res.success) {
        saveSSOPendingLogin({ identifier, method });
        window.location.pathname = `/auth/sso`;
    } else {
        setStatus({
            error: true,
            msg: res.msg || "Couldn't log you in. Please try again.",
        });
        setLoading(false);
    }
}
