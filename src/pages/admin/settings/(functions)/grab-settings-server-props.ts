import userAuth from "@/src/functions/backend/auth/user-auth";
import grabUsers from "@/src/functions/backend/db/users/grab-users";
import sanitizeUserBio from "@/src/functions/backend/db/users/sanitize-user-bio";
import grabUserPasswordHash from "@/src/functions/backend/auth/grab-user-password-hash";
import type { PagePropsType } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";

type Params = Parameters<BunextPageServerFn<PagePropsType>>[0];

/**
 * Shared server props for the `/admin/settings` sub-pages.
 */
export default async function grabSettingsServerProps({ req }: Params) {
    const { user } = await userAuth({ req });

    if (!user?.id) {
        return {
            redirect: {
                destination: "/auth/login",
            },
        };
    }

    const user_res = await grabUsers({ user_id: user.id });

    if (!user_res.singleRes) {
        return {
            redirect: {
                destination: "/admin",
            },
        };
    }

    const has_password = Boolean(
        await grabUserPasswordHash({ user_id: user.id }),
    );

    return {
        props: {
            person: sanitizeUserBio({ user: user_res.singleRes }),
            has_password,
        },
    };
}
