import type { BunextPageServerFn } from "@moduletrace/bunext/types";
import type { PagePropsType } from "../types";
import userAuth from "../functions/backend/auth/user-auth";
import grabHasUsers from "../functions/backend/auth/grab-has-users";
import isAdminSectionPath from "../utils/is-admin-section-path";
import { AdminHomePath } from "../dict/admin-sections-dict";
import isUnknownSettingsPath from "../utils/is-unknown-settings-path";
import { SettingsDefaultPath } from "../dict/settings-pages-dict";
import grabInstallName from "../functions/backend/db/app-settings/grab-install-name";
import grabInstallIcon from "../functions/backend/db/app-settings/grab-install-icon";
import readLastVisitedWorkspace from "../utils/read-last-visited-workspace";

/**
 * Routing for a local install. There are no public pages:
 * - no account yet: everything goes to `/auth/signup` (super admin setup)
 * - signup after setup: back to `/auth/login` (or the bots if logged in)
 * - anything outside the live admin sections and `/auth`: `/admin/bots`
 * - an unknown `/admin/settings/*` page: `/admin/settings/general`
 * - `/admin/*` logged out: `/auth/login`
 * - `/auth/*` logged in (except logout): `/admin/bots`
 */
const server: BunextPageServerFn<PagePropsType> = async ({ req, url }) => {
    const { user, user_types } = await userAuth({ req });
    const is_signup_page = url.pathname.startsWith("/auth/signup");
    const has_users = await grabHasUsers();

    if (
        !has_users &&
        user?.logged_in_status &&
        !url.pathname.includes(`auth/logout`)
    ) {
        return redirect({ destination: "/auth/logout" });
    }

    if (
        !has_users &&
        user?.logged_in_status &&
        url.pathname.includes(`auth/logout`)
    ) {
        return {};
    }

    if (!has_users && !is_signup_page) {
        return redirect({ destination: "/auth/signup" });
    }

    if (has_users && is_signup_page) {
        return redirect({
            destination: user?.logged_in_status ? AdminHomePath : "/auth/login",
        });
    }

    if (url.pathname.startsWith("/admin") && !user?.logged_in_status) {
        return redirect({ destination: "/auth/login" });
    }

    if (
        !isAdminSectionPath({ pathname: url.pathname }) &&
        !url.pathname.startsWith("/auth")
    ) {
        return redirect({ destination: AdminHomePath });
    }

    if (isUnknownSettingsPath({ pathname: url.pathname })) {
        return redirect({ destination: SettingsDefaultPath });
    }

    if (
        url.pathname.startsWith("/auth") &&
        !url.pathname.match(/logout/) &&
        user?.logged_in_status
    ) {
        return redirect({ destination: AdminHomePath });
    }

    return {
        props: {
            environment: process.env.NODE_ENV,
            envs: {
                GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
                R2_PUBLIC_DOMAIN: process.env.R2_PUBLIC_DOMAIN || "",
                PAYSTACK_PUBLIC_KEY: process.env.PAYSTACK_PUBLIC_KEY || "",
            },
            user,
            user_types,
            install_name: await grabInstallName().catch(() => ""),
            install_icon: await grabInstallIcon().catch(() => null),
            last_visited_workspace_id: readLastVisitedWorkspace({ req }),
        },
    };
};

function redirect({ destination }: { destination: string }) {
    return {
        redirect: {
            destination,
            permanent: false,
        },
    };
}

export default server;
