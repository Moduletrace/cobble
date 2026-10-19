import type { ReactNode } from "react";
import ComputerIconTile from "@/src/components/general/computer-icon-tile";
import ComputerOpenButton from "@/src/components/general/computer-open-button";
import type { ComputerWithStatus } from "@/src/types";
import computerResourcesLabel from "@/src/utils/computer-resources-label";
import computerStatusLabel from "@/src/utils/computer-status-label";
import SettingsListRow from "./settings-list-row";

type Props = {
    computer: ComputerWithStatus;
    badge?: string;
    /**
     * Defaults to its state, resources and description.
     */
    subtitle?: string;
    /**
     * What can be done with it, after the open button.
     */
    children?: ReactNode;
    /**
     * Link the title to its settings page. Off for people who can't open it.
     */
    linked?: boolean;
};

/**
 * One computer in a settings list: its avatar and details, opening its
 * settings page from the title. Every list uses it, so the row behaves the
 * same, and the open button shows it in the viewer over the page.
 */
export default function ComputerListRow({ computer, badge, subtitle, children, linked = true }: Props) {
    const name = computer.name || `Computer ${computer.id}`;
    const ready = computer.status == "running";

    return (
        <SettingsListRow
            avatar={<ComputerIconTile />}
            href={linked ? `/admin/settings/computers/${computer.id}` : undefined}
            title={name}
            badge={badge}
            subtitle={
                subtitle ??
                [
                    computerStatusLabel({ computer }),
                    computerResourcesLabel({ computer }),
                    computer.description,
                ]
                    .filter(Boolean)
                    .join(" · ")
            }
        >
            <ComputerOpenButton
                computer_id={Number(computer.id)}
                name={name}
                title={ready ? `Open ${name}` : `${name} isn't running yet`}
                disabled={!ready}
            />
            {children}
        </SettingsListRow>
    );
}
