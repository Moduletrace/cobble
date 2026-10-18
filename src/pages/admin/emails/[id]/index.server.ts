import grabEmail from "@/src/functions/backend/db/documents/grab-email";
import grabEmailAttachments from "@/src/functions/backend/db/documents/grab-email-attachments";
import type { PagePropsType } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";

export const server: BunextPageServerFn<PagePropsType> = async (params) => {
    const email_id = params.query?.id;

    if (!email_id) {
        return {
            redirect: {
                destination: "/admin/emails",
            },
        };
    }

    const email_res = await grabEmail({ id: email_id });

    if (!email_res.singleRes) {
        return {
            redirect: {
                destination: "/admin/emails",
            },
        };
    }

    const email = email_res.singleRes;

    const attachments_res = await grabEmailAttachments({ email_id });
    const attachments = attachments_res.payload || [];

    return {
        props: {
            email,
            attachments,
        },
    };
};