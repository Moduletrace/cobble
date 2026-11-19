import type { ReactNode } from "react";
import Paper from "@moduletrace/twui/elements/Paper";
import Stack from "@moduletrace/twui/layout/Stack";

type Props = {
    children: ReactNode;
};

/**
 * The panel a settings row's three-dot menu opens: the same surface as
 * the conversation header's menu.
 */
export default function SettingsRowMenuPanel({ children }: Props) {
    return (
        <Paper
            role="menu"
            className="min-w-[220px] p-0! py-1 gap-0! items-stretch rounded-default bg-surface dark:bg-surface border-hairline dark:border-hairline shadow-popover! dark:shadow-popover!"
        >
            <Stack className="w-full gap-0! items-stretch">{children}</Stack>
        </Paper>
    );
}
