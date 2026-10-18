import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type useFormInit from "@/src/hooks/use-form-init";
import type { ApiReqParams, LoginFormObject } from "@/src/types";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import saveSSOPendingLogin from "@/src/functions/frontend/save-sso-pending-login";

export default async function submitRequestReset({
    setLoading,
    setStatus,
    form,
}: ReturnType<typeof useFormInit<LoginFormObject>>) {
    setLoading(true);

    const identifier = form.username_or_email?.trim() || "";

    const res = await fetchApi<ApiReqParams, APIResponseObject>(
        `/api/auth/request-password-reset`,
        {
            method: "POST",
            body: {
                login: {
                    email_or_username: identifier,
                },
            },
        },
    );

    if (res.success) {
        saveSSOPendingLogin({ identifier, method: "reset" });
        window.location.pathname = `/auth/reset-password/confirm`;
    } else {
        setStatus({
            error: true,
            msg: res.msg || "Couldn't send a reset code. Please try again.",
        });
        setLoading(false);
    }
}
