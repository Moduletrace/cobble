import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type useFormInit from "@/src/hooks/use-form-init";
import type { ApiReqParams, ContactFormObject } from "@/src/types";
import type { APIResponseObject } from "@moduletrace/bunext/types";

export default async function submitContactForm({
    setLoading,
    setStatus,
    form,
}: ReturnType<typeof useFormInit<ContactFormObject>>) {
    setLoading(true);

    const res = await fetchApi<ApiReqParams, APIResponseObject>(
        `/api/contact`,
        {
            method: "POST",
            body: {
                contact: {
                    name: form.name,
                    email: form.email,
                    subject: form.subject,
                    message: form.message,
                },
            },
        },
    );

    if (res.success) {
        setStatus({
            success: true,
            msg: res.msg || "Message sent successfully.",
        });
    } else {
        setStatus({
            error: true,
            msg: res.msg || "Message Failed",
        });
        console.log("res", res);
        console.log("form", form);
    }

    setLoading(false);
}
