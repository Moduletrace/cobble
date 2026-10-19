import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import Stack from "@moduletrace/twui/layout/Stack";
import SettingsBreadcrumbs from "./settings-breadcrumbs";
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
     * A nested record page's name, for its breadcrumb trail.
     */
    breadcrumb_title?: string;
};

/**
 * The settings pane beside the rail: a 64px header like the conversation
 * header, then one readable column that scrolls on its own.
 */
export default function SettingsShell({
    title,
    description,
    children,
    wide,
    breadcrumb_title,
}: Props) {
    return (
        <Stack className="grow min-w-0 h-full gap-0! items-stretch">
            <SettingsPaneHeader title={title} description={description} />
            <Stack className="grow min-h-0 overflow-y-auto gap-0! items-stretch">
                <Stack
                    className={twMerge(
                        "w-full max-w-container mx-auto gap-0! items-stretch px-6 lg:px-10 pb-16",
                        wide && "max-w-[1200px]",
                    )}
                >
                    {breadcrumb_title ? (
                        <SettingsBreadcrumbs title={breadcrumb_title} />
                    ) : null}
                    {children}
                </Stack>
            </Stack>
        </Stack>
    );
}
