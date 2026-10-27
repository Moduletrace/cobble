import { useContext, type ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import Stack from "@moduletrace/twui/layout/Stack";
import AdminBreadcrumbs from "@/src/components/general/admin-breadcrumbs";
import { AppContext } from "@/src/pages/__root";
import SettingsPaneHeader from "./settings-pane-header";

type Props = {
    title: string;
    description: string;
    children: ReactNode;
    /**
     * A wider column, for tables (activity).
     */
    wide?: boolean;
    /**
     * Controls at the end of the pane header, e.g. a settings link.
     */
    action?: ReactNode;
    /**
     * Leave out the breadcrumb trail: inside a workspace it would name the
     * workspace by its id, and the workspace's rail already says where the
     * page is.
     */
    no_trail?: boolean;
};

/**
 * The pane beside the rail: a 64px header like the conversation header,
 * then one readable column that scrolls on its own, opening with the
 * breadcrumb trail above the page.
 */
export default function SettingsShell({
    title,
    description,
    children,
    wide,
    action,
    no_trail,
}: Props) {
    const { pageProps } = useContext(AppContext);

    return (
        <Stack className="grow min-w-0 h-full gap-0! items-stretch">
            <SettingsPaneHeader
                title={title}
                description={description}
                action={action}
            />
            <Stack className="grow min-h-0 overflow-y-auto gap-0! items-stretch">
                <Stack
                    className={twMerge(
                        "w-full max-w-container mx-auto gap-0! items-stretch px-4 md:px-6 lg:px-10 pb-16",
                        wide && "max-w-[1200px]",
                    )}
                >
                    {/**
                     * The page's own `title` names the last crumb: the
                     * address would say the id of a record, or a slug that
                     * differs from the name the page shows.
                     */}
                    {no_trail ? (
                        <Stack className="w-full shrink-0 pt-5" />
                    ) : (
                        <AdminBreadcrumbs
                            pathname={pageProps?.url?.pathname}
                            title={title}
                        />
                    )}
                    {children}
                </Stack>
            </Stack>
        </Stack>
    );
}
