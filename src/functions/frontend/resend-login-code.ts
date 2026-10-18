import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type useFormInit from "@/src/hooks/use-form-init";
import type { ApiReqParams } from "@/src/types";
import type { APIResponseObject } from "@moduletrace/bunext/types";

type Params = Pick<ReturnType<typeof useFormInit>, "setLoading" | "setStatus">;

export default async function resendLoginCode({
    setLoading,
    setStatus,
}: Params) {
    setLoading(true);

    const res = await fetchApi<ApiReqParams, APIResponseObject>(
        `/api/auth/resend-login-code`,
        {
            method: "POST",
            body: {},
        },
    );

    setStatus(
        res.success
            ? {
                  success: true,
                  msg: "A new code is on its way. Previous codes no longer work.",
              }
            : {
                  error: true,
                  msg: res.msg || "Couldn't resend the code. Please try again.",
              },
    );
    setLoading(false);
}
