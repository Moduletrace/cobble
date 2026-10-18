import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type useFormInit from "@/src/hooks/use-form-init";
import type { ApiReqParams, SSOFormObject } from "@/src/types";
import type { APIResponseObject } from "@moduletrace/bunext/types";

export default async function submitSSOForm({
    setLoading,
    setStatus,
    form,
}: ReturnType<typeof useFormInit<SSOFormObject>>) {
    setLoading(true);

    const res = await fetchApi<ApiReqParams, APIResponseObject>(
        `/api/auth/login`,
        {
            method: "POST",
            body: {
                sso_code: form.code?.trim(),
            },
        },
    );

    if (res.success) {
        window.location.pathname = `/admin`;
    } else {
        setStatus({
            error: true,
            msg: res.msg || "Couldn't log you in. Please try again.",
        });
        setLoading(false);
    }
}
