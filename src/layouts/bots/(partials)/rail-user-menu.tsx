import Paper from "@moduletrace/twui/elements/Paper";
import Divider from "@moduletrace/twui/layout/Divider";
import { RailUserMenuItems } from "../(dict)/rail-user-menu-dict";
import RailUserMenuEntry from "./rail-user-menu-entry";

/**
 * 220px popover: the only element in the shell with elevation.
 */
export default function RailUserMenu() {
    const items = RailUserMenuItems.filter((item) => !item.destructive);
    const destructive = RailUserMenuItems.filter((item) => item.destructive);

    return (
        <Paper
            role="menu"
            className="w-[220px] mb-1 p-0! py-1 gap-0! items-stretch rounded-default bg-surface dark:bg-surface border-hairline dark:border-hairline shadow-popover! dark:shadow-popover!"
        >
            {items.map((item) => (
                <RailUserMenuEntry key={item.title} {...item} />
            ))}
            <Divider className="my-1 mx-3 w-auto border-hairline dark:border-hairline" />
            {destructive.map((item) => (
                <RailUserMenuEntry key={item.title} {...item} />
            ))}
        </Paper>
    );
}
