import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type useFormInit from "@/src/hooks/use-form-init";
import type { ApiReqParams, LoginMethod, SignupFormObject } from "@/src/types";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import saveSSOPendingLogin from "@/src/functions/frontend/save-sso-pending-login";
import validatePassword from "@/src/utils/validate-password";

type Params = ReturnType<typeof useFormInit<SignupFormObject>> & {
    method: LoginMethod;
};

export default async function submitSignupForm({
    setLoading,
    setStatus,
    form,
    method,
}: Params) {
    const password_error =
        method == "password"
            ? validatePassword({ password: form.password })
            : undefined;

    if (password_error) {
        setStatus({ error: true, msg: password_error });
        return;
    }

    if (method == "password" && form.password != form.confirm_password) {
        setStatus({ error: true, msg: "The passwords don't match." });
        return;
    }

    setLoading(true);

    const res = await fetchApi<ApiReqParams, APIResponseObject>(
        `/api/auth/signup`,
        {
            method: "POST",
            body: {
                signup: {
                    first_name: form.first_name,
                    last_name: form.last_name,
                    username: form.username,
                    email: form.email,
                    password: method == "password" ? form.password : undefined,
                },
            },
        },
    );

    if (res.success) {
        saveSSOPendingLogin({
            identifier: form.email?.trim() || "",
            method,
        });
        window.location.pathname = `/auth/sso`;
    } else {
        setStatus({
            error: true,
            msg: res.msg || "Couldn't create your account. Please try again.",
        });

        setLoading(false);
    }
}
