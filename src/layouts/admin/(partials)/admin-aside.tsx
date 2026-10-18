import Row from "@moduletrace/twui/layout/Row";
import Stack from "@moduletrace/twui/layout/Stack";
import Logo from "@/src/components/general/logo";
import AdminAsideLinks from "./admin-aside-links-dict";
import AdminAsideUser from "./admin-aside-user";
import { twMerge } from "tailwind-merge";

type Props = {
    className?: string;
};

export default function AdminAside({ className }: Props) {
    return (
        <aside
            data-admin-nav
            className={twMerge(
                "w-64 shrink-0 sticky top-0 h-screen flex-col",
                className,
            )}
        >
            <Row className="h-16 px-6 flex-nowrap">
                <Logo icon_size={26} />
            </Row>
            <nav className="w-full grow overflow-y-auto px-3 py-4">
                <AdminAsideLinks />
            </nav>
            <Stack className="w-full items-stretch p-3 border-t border-slate-200 dark:border-white/10">
                <AdminAsideUser />
            </Stack>
        </aside>
    );
}
