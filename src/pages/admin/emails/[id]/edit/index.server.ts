import grabEmail from "@/src/functions/backend/db/documents/grab-email";
import type { PagePropsType } from "@/src/types";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";

export const server: BunextPageServerFn<PagePropsType> = async (params) => {
    const email_id = params.query?.id;
    const user_types = params.props?.user_types;

    if (isReadOnlyUser({ user_types })) {
        return {
            redirect: {
                destination: "/admin/emails",
            },
        };
    }

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

    return {
        props: {
            email: email_res.singleRes,
        },
    };
};