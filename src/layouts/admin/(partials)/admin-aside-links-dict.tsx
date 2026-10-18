import Stack from "@moduletrace/twui/layout/Stack";
import { AppContext } from "@/src/pages/__root";
import { useContext } from "react";
import checkUserAccess from "@/src/functions/backend/auth/check-user-access";
import { AdminAsideGroups } from "../(dict)/admin-aside-groups-dict";
import AdminAsideLinkGroup from "./admin-aside-link-group";

export default function AdminAsideLinks() {
    const { pageProps } = useContext(AppContext);
    const { user, user_types } = pageProps || {};

    if (!user?.logged_in_status) {
        return null;
    }

    const is_super_admin = Boolean(checkUserAccess({ user_types }).success);

    return (
        <Stack className="w-full items-stretch gap-7!">
            {AdminAsideGroups.map((group) => (
                <AdminAsideLinkGroup
                    key={group.label}
                    {...group}
                    is_super_admin={is_super_admin}
                />
            ))}
        </Stack>
    );
}
