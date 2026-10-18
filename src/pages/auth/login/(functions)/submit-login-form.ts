import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import { AdminHomePath } from "@/src/dict/admin-sections-dict";
import type useFormInit from "@/src/hooks/use-form-init";
import type { ApiReqParams, LoginFormObject } from "@/src/types";
import type { APIResponseObject } from "@moduletrace/bunext/types";

type Params = ReturnType<typeof useFormInit<LoginFormObject>>;

export default async function submitLoginForm({
    setLoading,
    setStatus,
    form,
}: Params) {
    setLoading(true);

    const res = await fetchApi<ApiReqParams, APIResponseObject>(
        `/api/auth/password-login`,
        {
            method: "POST",
            body: {
                login: {
                    email_or_username: form.username_or_email?.trim() || "",
                    password: form.password,
                },
            },
        },
    );

    if (res.success) {
        window.location.pathname = AdminHomePath;
    } else {
        setStatus({
            error: true,
            msg: res.msg || "Couldn't log you in. Please try again.",
        });
        setLoading(false);
    }
}
