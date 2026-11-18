import { FolderTree } from "lucide-react";
import IconTile from "@/src/components/general/icon-tile";
import { HostDirectoryAccesses } from "@/src/dict/host-directory-dict";
import type { HostDirectoryMountView } from "@/src/types";
import hostDirectoryLinkState from "@/src/utils/host-directory-link-state";
import HostDirectoryCheckTag from "./host-directory-check-tag";
import SettingsListRow from "./settings-list-row";

type Props = {
    mount: HostDirectoryMountView;
};

/**
 * One folder from the host machine as a computer or workspace sees it:
 * where it is, what its bots may do there, and the last check.
 */
export default function HostDirectoryMountRow({ mount }: Props) {
    const access =
        HostDirectoryAccesses.find((item) => item.value == mount.access)
            ?.title || "Read and write";

    const state = hostDirectoryLinkState({
        access: mount.access,
        checks: mount.checks,
    });

    return (
        <SettingsListRow
            avatar={<IconTile Icon={FolderTree} />}
            title={mount.name}
            subtitle={`${mount.source} · ${access.toLowerCase()}`}
        >
            <HostDirectoryCheckTag
                state={state}
                checked_at={mount.checks[0]?.checked_at}
            />
        </SettingsListRow>
    );
}