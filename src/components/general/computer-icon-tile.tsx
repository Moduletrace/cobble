import computerIcon from "@/src/utils/computer-icon";
import IconTile from "./icon-tile";

/**
 * A computer's avatar in lists: its icon (`computerIcon`) on a small tile.
 */
export default function ComputerIconTile({
    connection,
}: {
    /**
     * `ssh` wears a server instead of a monitor.
     */
    connection?: string | null;
}) {
    return <IconTile Icon={computerIcon({ connection })} />;
}