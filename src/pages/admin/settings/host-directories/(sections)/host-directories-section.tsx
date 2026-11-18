import { useContext, useState } from "react";
import Button from "@moduletrace/twui/layout/Button";
import Stack from "@moduletrace/twui/layout/Stack";
import { Plus } from "lucide-react";
import { AppContext } from "@/src/pages/__root";
import type { HostDirectoryWithLinks } from "@/src/types";
import SettingsGroup from "../../(partials)/settings-group";
import SettingsList from "../../(partials)/settings-list";
import SettingsStatus from "../../(partials)/settings-status";
import fetchHostDirectories from "../(functions)/fetch-host-directories";
import HostDirectoryModal from "../(partials)/host-directory-modal";
import HostDirectoryRow from "../(partials)/host-directory-row";

type Status = { error?: boolean; success?: boolean; msg?: string };

/**
 * Every folder on the host machine and where it is mounted. Super admins
 * add one and link it to computers or workspaces; the folder's own owner
 * gives the bots' accounts access on the host, and a check tells them
 * whether that worked.
 */
export default function HostDirectoriesSection() {
    const { pageProps } = useContext(AppContext);
    const [directories, setDirectories] = useState<HostDirectoryWithLinks[]>(
        pageProps?.host_directories || [],
    );
    const [editing, setEditing] = useState<HostDirectoryWithLinks | "new">();
    const [status, setStatus] = useState<Status>();

    const computers = pageProps?.computers || [];
    const workspaces = pageProps?.workspaces || [];

    const refresh = async ({ msg }: { msg: string }) => {
        setEditing(undefined);

        const res = await fetchHostDirectories();

        if (!res.success || !res.payload) {
            setStatus({
                error: true,
                msg: res.msg || "That worked, but the list couldn't be read.",
            });
            return;
        }

        setDirectories(res.payload);
        setStatus({ success: true, msg });
    };

    return (
        <Stack className="w-full gap-4! items-stretch">
            <SettingsGroup
                title="Host directories"
                description="Folders on the machine Cobble runs on, mounted inside the computers your bots work on. Linked to a computer, every bot that reaches it sees the folder at hosts/<name> in its own folder. Linked to a workspace, every bot there sees it at <name> in the workspace's shared folder, on every computer the workspace is on. Cobble gives every bot that reaches the folder access to it with an ACL entry of its own, leaving ownership and the folder's other permissions alone, then checks that they can write there."
            >
                {editing ? (
                    <HostDirectoryModal
                        directory={editing == "new" ? undefined : editing}
                        onSaved={(msg) => refresh({ msg })}
                        onCancel={() => setEditing(undefined)}
                    />
                ) : null}
                <SettingsList
                    is_empty={!directories.length}
                    empty="No folder on the host machine yet."
                >
                    {directories.map((directory) => (
                        <HostDirectoryRow
                            key={directory.id}
                            directory={directory}
                            computers={computers}
                            workspaces={workspaces}
                            onEdit={() => setEditing(directory)}
                            onChanged={(msg) => refresh({ msg })}
                            onError={(msg) => setStatus({ error: true, msg })}
                        />
                    ))}
                </SettingsList>
                {!editing ? (
                    <Button
                        title="Add a folder on the host machine"
                        type="button"
                        variant="ghost"
                        color="gray"
                        size="small"
                        onClick={() => setEditing("new")}
                        className="self-start gap-1!"
                    >
                        <Plus size={14} aria-hidden />
                        New host directory
                    </Button>
                ) : null}
                <SettingsStatus status={status} />
            </SettingsGroup>
        </Stack>
    );
}