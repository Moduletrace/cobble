import Stack from "@moduletrace/twui/layout/Stack";
import Span from "@moduletrace/twui/layout/Span";
import useLoginMethod from "@/src/hooks/use-login-method";
import type { AdminAsideGroup } from "../(dict)/admin-aside-groups-dict";
import filterAdminAsideLinks from "../(functions)/filter-admin-aside-links";
import AdminAsideLinkEntry from "./admin-aside-link-entry";

type Props = AdminAsideGroup & {
    is_super_admin: boolean;
};

export default function AdminAsideLinkGroup({
    label,
    links,
    is_super_admin,
}: Props) {
    const login_method = useLoginMethod();

    const visible_links = filterAdminAsideLinks({
        links,
        is_super_admin,
        login_method,
    });

    if (!visible_links[0]) {
        return null;
    }

    return (
        <Stack className="w-full items-stretch gap-2!">
            <Span className="px-3 text-xs font-medium  text-slate-400">
                {label}
            </Span>
            <Stack className="w-full items-stretch gap-0.5!">
                {visible_links.map((link) => (
                    <AdminAsideLinkEntry key={link.title} link={link} />
                ))}
            </Stack>
        </Stack>
    );
}
