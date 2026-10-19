import Span from "@moduletrace/twui/layout/Span";
import type { LucideIcon } from "lucide-react";

type Props = {
    Icon: LucideIcon;
};

/**
 * An avatar in lists for what has no picture: its icon on a small tile.
 */
export default function IconTile({ Icon }: Props) {
    return (
        <Span className="size-8 shrink-0 flex items-center justify-center rounded-default-sm border border-solid border-hairline bg-paper">
            <Icon size={16} aria-hidden />
        </Span>
    );
}
