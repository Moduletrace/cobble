import grabUsers from "@/src/functions/backend/db/users/grab-users";
import sanitizeUserBio from "@/src/functions/backend/db/users/sanitize-user-bio";
import type { PagePropsType, PageQueryObject } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";

export const server: BunextPageServerFn<PagePropsType> = async (params) => {
    const query: PageQueryObject = params.query;

    if (!query.user_id) {
        return {
            redirect: {
                destination: "/admin",
            },
        };
    }

    const user_res = await grabUsers({ query: { user_id: query.user_id } });

    if (!user_res.singleRes) {
        return {
            redirect: {
                destination: "/admin",
            },
        };
    }

    return {
        props: {
            person: sanitizeUserBio({ user: user_res.singleRes }),
        },
    };
};
