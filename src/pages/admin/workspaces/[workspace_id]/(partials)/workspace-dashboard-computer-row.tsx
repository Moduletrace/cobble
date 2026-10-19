import ComputerListRow from "@/src/pages/admin/settings/(partials)/computer-list-row";
import type { ComputerWithStatus } from "@/src/types";

type Props = {
    computer: ComputerWithStatus;
    is_default: boolean;
};

/**
 * A computer in the workspace dashboard: its state, resources and what
 * it's for, opening its settings page.
 */
export default function WorkspaceDashboardComputerRow({ computer, is_default }: Props) {
    return <ComputerListRow computer={computer} badge={is_default ? "Default" : undefined} />;
}
