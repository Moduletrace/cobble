import ComputerListRow from "@/src/pages/admin/settings/(partials)/computer-list-row";
import type { ComputerWithStatus } from "@/src/types";

type Props = {
    computer: ComputerWithStatus;
    is_default: boolean;
    /**
     * Whether the viewer can open its settings page.
     */
    linked: boolean;
};

/**
 * A computer in the workspace dashboard: its state, resources and what
 * it's for, opening its settings page for those who manage the crew.
 */
export default function WorkspaceDashboardComputerRow({ computer, is_default, linked }: Props) {
    return <ComputerListRow computer={computer} badge={is_default ? "Default" : undefined} linked={linked} />;
}
