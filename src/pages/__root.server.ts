import type { BunextPageServerFn } from "@moduletrace/bunext/types";
import type { PagePropsType } from "../types";
import userAuth from "../functions/backend/auth/user-auth";
import grabLoginMethod from "../functions/backend/auth/grab-login-method";

const server: BunextPageServerFn<PagePropsType> = async ({ req, url }) => {
    const { user, user_types } = await userAuth({ req });
    const is_admin_page =
        url.pathname.startsWith("/admin") || url.pathname.startsWith("/auth");

    if (url.pathname.startsWith("/admin") && !user?.logged_in_status) {
        return {
            redirect: {
                destination: "/auth/login",
                permanent: false,
            },
        };
    }

    if (
        url.pathname.startsWith("/auth") &&
        !url.pathname.match(/logout/) &&
        user?.logged_in_status
    ) {
        return {
            redirect: {
                destination: "/admin",
                permanent: false,
            },
        };
    }

    return {
        props: {
            environment: process.env.NODE_ENV,
            envs: {
                AUTH_LOGIN_METHOD: grabLoginMethod(),
                GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
                R2_PUBLIC_DOMAIN: process.env.R2_PUBLIC_DOMAIN || "",
                PAYSTACK_PUBLIC_KEY: process.env.PAYSTACK_PUBLIC_KEY || "",
            },
            user,
            user_types,
        },
        cache_page: is_admin_page ? false : true,
        cache_expiry: 360,
    };
};

export default server;
