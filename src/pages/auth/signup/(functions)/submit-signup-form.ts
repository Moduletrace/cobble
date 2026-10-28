import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import { SettingsSetupPath } from "@/src/dict/settings-pages-dict";
import type useFormInit from "@/src/hooks/use-form-init";
import type { ApiReqParams, SignupFormObject } from "@/src/types";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import validatePassword from "@/src/utils/validate-password";

type Params = ReturnType<typeof useFormInit<SignupFormObject>>;

export default async function submitSignupForm({
    setLoading,
    setStatus,
    form,
}: Params) {
    const password_error = validatePassword({ password: form.password });

    if (password_error) {
        setStatus({ error: true, msg: password_error });
        return;
    }

    if (form.password != form.confirm_password) {
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
                    password: form.password,
                },
            },
        },
    );

    /**
     * The first (super admin) account opens on the guided setup, which
     * can be skipped.
     */
    if (res.success) {
        window.location.pathname = SettingsSetupPath;
    } else {
        setStatus({
            error: true,
            msg: res.msg || "Couldn't create your account. Please try again.",
        });

        setLoading(false);
    }
}
