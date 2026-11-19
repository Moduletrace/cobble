import type { ReactNode } from "react";
import { CircleAlert, KeyRound, Lock, RefreshCw, ShieldOff, Unlink } from "lucide-react";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import ComputerIconTile from "@/src/components/general/computer-icon-tile";
import WorkspaceAvatar from "@/src/components/general/workspace-avatar";
import {
    HostDirectoryAccesses,
    type HostDirectoryAccess,
    type HostDirectoryCheckState,
} from "@/src/dict/host-directory-dict";
import HostDirectoryCheckTag from "../../(partials)/host-directory-check-tag";
import HostDirectoryCommandNote from "../../(partials)/host-directory-command-note";
import SettingsListRow from "../../(partials)/settings-list-row";
import SettingsRowMenu from "../../(partials)/settings-row-menu";
import SettingsRowMenuItem from "../../(partials)/settings-row-menu-item";
import SettingsRowMenuPanel from "../../(partials)/settings-row-menu-panel";

type Props = {
    /**
     * A computer, or a workspace. The picture is the workspace's own;
     * a computer always wears the monitor.
     */
    kind: "computer" | "workspace";
    /**
     * The computer or workspace it is mounted in.
     */
    name: string;
    href: string;
    /**
     * The workspace's picture. Left out for a computer, and for a
     * workspace that has none.
     */
    image_media_id?: number | null;
    access: HostDirectoryAccess;
    state: HostDirectoryCheckState;
    checked_at?: number | null;
    /**
     * What to run on the host machine when the bots can't write there.
     */
    command?: string;
    /**
     * A bot that sees the folder now wasn't there when it was last checked.
     */
    stale?: boolean;
    /**
     * Why the last check couldn't say anything about it.
     */
    error?: string | null;
    /**
     * Whether a delete inside the folder waits for the user.
     */
    gate_deletes: boolean;
    busy?: boolean;
    checking?: boolean;
    granting?: boolean;
    onCheck?: () => void;
    /**
     * Gives every bot that sees the folder access to it again, for when
     * giving it access by itself did not work.
     */
    onGrant?: () => void;
    onAccess: () => void;
    /**
     * Turns asking before a delete on or off for this place.
     */
    onDeletes: () => void;
    onRemove: () => void;
};

/**
 * One place a host directory is mounted: a computer, or a workspace (on
 * every computer it is on), what its bots can do there, and what the last
 * check found. The avatar says which kind it is.
 */
export default function HostDirectoryLinkRow({
    kind,
    name,
    href,
    image_media_id,
    access,
    state,
    checked_at,
    command,
    stale,
    error,
    gate_deletes,
    busy,
    checking,
    granting,
    onCheck,
    onGrant,
    onAccess,
    onDeletes,
    onRemove,
}: Props) {
    const access_title =
        HostDirectoryAccesses.find((item) => item.value == access)?.title ||
        "Read and write";
    const place = kind == "workspace" ? "Workspace" : "Computer";

    const notes: ReactNode[] = [];

    if (error) {
        notes.push(
            <Span key="error" role="alert" className="flex items-center gap-1.5 text-[12px] leading-4 text-ink">
                <CircleAlert size={14} aria-hidden className="shrink-0" />
                Couldn't check it: {error}
            </Span>,
        );
    }

    if (stale && !error) {
        notes.push(
            <Span key="stale" role="status" className="flex items-center gap-1.5 text-[12px] leading-4 text-ink-secondary">
                <CircleAlert size={14} aria-hidden className="shrink-0" />
                A bot was added since the last check, so its account hasn't been tested. Check again.
            </Span>,
        );
    }

    if (command) notes.push(<HostDirectoryCommandNote key="command" command={command} />);

    return (
        <Stack className="w-full gap-1! items-stretch border-t border-solid border-hairline py-1 first:border-t-0">
            <SettingsListRow
                avatar={
                    kind == "workspace" ? (
                        <WorkspaceAvatar image_media_id={image_media_id} />
                    ) : (
                        <ComputerIconTile />
                    )
                }
                title={name}
                href={href}
                badge={place}
                subtitle={access_title}
            >
                <HostDirectoryCheckTag state={state} checked_at={checked_at} />
                <SettingsRowMenu title={`${name} menu`} disabled={busy || checking}>
                    <SettingsRowMenuPanel>
                        {onGrant && access == "read-write" && (stale || state == "partial" || state == "read-only") ? (
                            <SettingsRowMenuItem
                                icon={KeyRound}
                                title={granting ? "Giving access" : "Give access"}
                                description="Give every bot that sees this folder access to it"
                                loading={granting}
                                disabled={busy || checking || granting}
                                onClick={onGrant}
                            />
                        ) : null}
                        {onCheck ? (
                            <SettingsRowMenuItem
                                icon={RefreshCw}
                                title={checking ? "Checking" : "Check"}
                                description="Check that the bots can read and write it now"
                                loading={checking}
                                disabled={busy || checking}
                                onClick={onCheck}
                            />
                        ) : null}
                        <SettingsRowMenuItem
                            icon={access == "read-write" ? Lock : KeyRound}
                            title={access == "read-write" ? "Read only" : "Read and write"}
                            description={
                                access == "read-write"
                                    ? "Mount it read only, so the bots can't change it"
                                    : "Let the bots write there"
                            }
                            disabled={busy || checking}
                            onClick={onAccess}
                        />
                        <SettingsRowMenuItem
                            icon={gate_deletes ? ShieldOff : Lock}
                            title={gate_deletes ? "Ask before deletes" : "Delete freely"}
                            description={
                                gate_deletes
                                    ? "Stop asking: the bots can delete in it without your approval"
                                    : "Ask you before a bot deletes anything in it"
                            }
                            disabled={busy || checking}
                            onClick={onDeletes}
                        />
                        <SettingsRowMenuItem
                            icon={Unlink}
                            title="Remove"
                            description={`Unmount it from ${name}`}
                            disabled={busy || checking}
                            onClick={onRemove}
                        />
                    </SettingsRowMenuPanel>
                </SettingsRowMenu>
            </SettingsListRow>
            {notes.length ? <Stack className="w-full gap-1! items-stretch px-3 pb-2">{notes}</Stack> : null}
        </Stack>
    );
}
