import Link from "@moduletrace/twui/layout/Link";
import Span from "@moduletrace/twui/layout/Span";
import type { HostDirectoryMountView } from "@/src/types";
import HostDirectoryMountRow from "./host-directory-mount-row";
import SettingsGroup from "./settings-group";
import SettingsList from "./settings-list";

type Props = {
    /**
     * What these folders mean for the bots here, e.g. where they see them.
     */
    description: string;
    mounts: HostDirectoryMountView[];
};

/**
 * The folders from the host machine mounted in a computer or a workspace:
 * read-only here, since adding and linking them belongs to the super admin
 * on Settings > Host directories.
 */
export default function HostDirectoryMountsGroup({
    description,
    mounts,
}: Props) {
    return (
        <SettingsGroup title="Host directories" description={description}>
            <SettingsList
                is_empty={!mounts.length}
                empty="No folder from the host machine is mounted here."
            >
                {mounts.map((mount) => (
                    <HostDirectoryMountRow
                        key={mount.host_directory_id}
                        mount={mount}
                    />
                ))}
            </SettingsList>
            <Span className="text-[12px] leading-4 text-ink-secondary">
                Super admins add folders and choose where they are mounted in{" "}
                <Link href="/admin/settings/host-directories">
                    Host directories
                </Link>
                .
            </Span>
        </SettingsGroup>
    );
}