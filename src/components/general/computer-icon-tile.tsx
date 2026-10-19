import Span from "@moduletrace/twui/layout/Span";
import { Monitor } from "lucide-react";

/**
 * A computer's avatar in lists: the monitor icon on a small tile.
 */
export default function ComputerIconTile() {
    return (
        <Span className="size-8 shrink-0 flex items-center justify-center rounded-default-sm border border-solid border-hairline bg-paper">
            <Monitor size={16} aria-hidden />
        </Span>
    );
}
