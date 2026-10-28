import type { LucideIcon } from "lucide-react";
import IconTile from "@/src/components/general/icon-tile";
import SettingsListRow from "../../(partials)/settings-list-row";

export type SetupLink = {
    title: string;
    description: string;
    href: string;
    Icon: LucideIcon;
};

/**
 * One place to go on from the setup.
 */
export default function SetupLinkRow({ title, description, href, Icon }: SetupLink) {
    return (
        <SettingsListRow
            avatar={<IconTile Icon={Icon} />}
            title={title}
            href={href}
            subtitle={description}
        />
    );
}
