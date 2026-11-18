import { useState } from "react";
import { FolderTree } from "lucide-react";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import IconTile from "@/src/components/general/icon-tile";
import {
    type HostDirectoryAccess,
    type HostDirectoryCheckState,
} from "@/src/dict/host-directory-dict";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import type {
    ComputerWithStatus,
    HostDirectoryWithLinks,
    WorkspaceWithActivity,
} from "@/src/types";
import hostDirectoryLinkState from "@/src/utils/host-directory-link-state";
import hostDirectoryCheckStale from "@/src/utils/host-directory-check-stale";
import hostDirectoryPermissionCommand from "@/src/utils/host-directory-permission-command";
import InlineAddSelect from "@/src/components/general/inline-add-select";
import SettingsListRow from "../../(partials)/settings-list-row";
import SettingsRowAction from "../../(partials)/settings-row-action";
import HostDirectoryLinkRow from "./host-directory-link-row";

type Props = {
    directory: HostDirectoryWithLinks;
    /**
     * Every computer, for mounting it in one.
     */
    computers: ComputerWithStatus[];
    /**
     * Every workspace, for mounting it in one.
     */
    workspaces: WorkspaceWithActivity[];
    onEdit: () => void;
    /**
     * After a change: the message to show.
     */
    onChanged: (msg: string) => void;
    onError: (msg: string) => void;
};

type LinkView = {
    key: string;
    name: string;
    href: string;
    access: HostDirectoryAccess;
    state: HostDirectoryCheckState;
    checked_at?: number | null;
    command?: string;
    stale?: boolean;
    error?: string | null;
    checking?: boolean;
    granting?: boolean;
    onCheck: () => void;
    onGrant: () => void;
    onAccess: () => void;
    onRemove: () => void;
};

/**
 * One folder on the host machine: what it is, where it is mounted, and the
 * one control that gives a bot's account access to it.
 */
export default function HostDirectoryRow({
    directory,
    computers,
    workspaces,
    onEdit,
    onChanged,
    onError,
}: Props) {
    const [busy, setBusy] = useState<string>();
    const [checking, setChecking] = useState<number>();
    const [granting, setGranting] = useState(false);

    const name = String(directory.name || "");
    const source = String(directory.source || "");

    const post = async ({
        path,
        body,
        key,
    }: {
        path: string;
        body?: Record<string, unknown>;
        key: string;
    }) => {
        setBusy(key);

        const res = await postAdminApi({
            path: `host-directories/${path}`,
            body: { host_directory_id: directory.id, ...body },
        });

        setBusy(undefined);

        if (!res.success) {
            onError(res.msg || "That didn't work.");
            return;
        }

        onChanged(res.msg || "Saved.");
    };

    const grant = async () => {
        setGranting(true);

        const res = await postAdminApi({
            path: "host-directories/grant-host-directory",
            body: { host_directory_id: directory.id },
        });

        setGranting(false);

        if (!res.success) {
            onError(res.msg || "Couldn't give the bots access.");
            return;
        }

        onChanged(res.msg || "Every bot that sees it can work in it now.");
    };

    const check = async ({ computer_ids }: { computer_ids: number[] }) => {
        for (const computer_id of computer_ids) {
            setChecking(computer_id);

            const res = await postAdminApi({
                path: "host-directories/check-host-directory",
                body: { host_directory_id: directory.id, computer_id },
            });

            if (!res.success) {
                setChecking(undefined);
                onError(res.msg || "Couldn't check it.");
                return;
            }
        }

        setChecking(undefined);
        onChanged("Checked.");
    };

    /**
     * The way back when giving access by itself failed: only a check that
     * says they still can't write asks for a command. A bot added since the
     * last check is granted access by the app, so it is told to check again,
     * not to run anything.
     */
    const command = ({
        access,
        state,
        uids,
    }: {
        access: HostDirectoryAccess;
        state: HostDirectoryCheckState;
        uids?: number[];
    }) => {
        if (access != "read-write") return undefined;
        if (state != "partial" && state != "read-only") return undefined;

        return hostDirectoryPermissionCommand({
            source,
            uids: uids || [],
        });
    };

    const computer_links: LinkView[] = directory.computers.map((link) => {
        const access = link.access as HostDirectoryAccess;
        const item = link.check || null;
        const state = hostDirectoryLinkState({ access, checks: [item] });
        const stale = hostDirectoryCheckStale({ check: item, uids: link.uids });

        return {
            key: `computer-${link.id}`,
            name: link.computer_name || `Computer ${link.computer_id}`,
            href: `/admin/settings/computers/${link.computer_id}`,
            access,
            state,
            checked_at: item?.checked_at,
            error: item?.error,
            stale,
            command: command({ access, state, uids: link.uids }),
            checking: checking == Number(link.computer_id),
            granting,
            onCheck: () => check({ computer_ids: [Number(link.computer_id)] }),
            onGrant: grant,
            onAccess: () =>
                post({
                    path: "set-host-directory-access",
                    key: `access-${link.id}`,
                    body: {
                        computer_id: Number(link.computer_id),
                        access:
                            access == "read-write" ? "read-only" : "read-write",
                    },
                }),
            onRemove: () =>
                post({
                    path: "unlink-host-directory",
                    key: `unlink-${link.id}`,
                    body: { computer_id: Number(link.computer_id) },
                }),
        };
    });

    const workspace_links: LinkView[] = directory.workspaces.map((link) => {
        const access = link.access as HostDirectoryAccess;
        const items = link.checks || [];
        const state = hostDirectoryLinkState({ access, checks: items });
        const stale = items.some((item) =>
            hostDirectoryCheckStale({ check: item, uids: link.uids }),
        );

        return {
            key: `workspace-${link.id}`,
            name: link.workspace_name || `Workspace ${link.workspace_id}`,
            href: `/admin/settings/workspaces/${link.workspace_id}`,
            access,
            state,
            checked_at: items[0]?.checked_at,
            error: items.find((item) => item.error)?.error,
            stale,
            command: command({ access, state, uids: link.uids }),
            checking: (link.computer_ids || []).includes(checking || -1),
            granting,
            onCheck: () => check({ computer_ids: link.computer_ids || [] }),
            onGrant: grant,
            onAccess: () =>
                post({
                    path: "set-host-directory-access",
                    key: `access-${link.id}`,
                    body: {
                        workspace_id: Number(link.workspace_id),
                        access:
                            access == "read-write" ? "read-only" : "read-write",
                    },
                }),
            onRemove: () =>
                post({
                    path: "unlink-host-directory",
                    key: `unlink-${link.id}`,
                    body: { workspace_id: Number(link.workspace_id) },
                }),
        };
    });

    const links = [...computer_links, ...workspace_links];

    const addable_computers = computers
        .filter(
            (computer) =>
                !directory.computers.some(
                    (link) => Number(link.computer_id) == Number(computer.id),
                ),
        )
        .map((computer) => ({
            value: String(computer.id),
            title: computer.name || `Computer ${computer.id}`,
        }));

    const addable_workspaces = workspaces
        .filter(
            (workspace) =>
                !directory.workspaces.some(
                    (link) => Number(link.workspace_id) == Number(workspace.id),
                ),
        )
        .map((workspace) => ({
            value: String(workspace.id),
            title: workspace.name || `Workspace ${workspace.id}`,
        }));

    const remove = () => {
        if (
            !window.confirm(
                `Remove ${name}? Its computers and workspaces stop seeing the folder. Nothing in the folder itself is deleted.`,
            )
        ) {
            return;
        }

        post({ path: "delete-host-directory", key: "delete" });
    };

    return (
        <Stack className="w-full gap-0! items-stretch border-b border-solid border-hairline py-1 last:border-b-0">
            <SettingsListRow
                avatar={<IconTile Icon={FolderTree} />}
                title={name}
                subtitle={source}
            >
                <SettingsRowAction
                    title={`Edit ${name}`}
                    label="Edit"
                    disabled={Boolean(busy)}
                    onClick={onEdit}
                />
                <SettingsRowAction
                    title={`Remove ${name}`}
                    label="Remove"
                    disabled={Boolean(busy)}
                    onClick={remove}
                />
            </SettingsListRow>
            <Stack className="w-full gap-2! items-stretch px-3 pt-1 pb-3">
                {links.length ? (
                    links.map((link) => (
                        <HostDirectoryLinkRow
                            key={link.key}
                            name={link.name}
                            href={link.href}
                            access={link.access}
                            state={link.state}
                            checked_at={link.checked_at}
                            command={link.command}
                            stale={link.stale}
                            error={link.error}
                            checking={link.checking}
                            busy={Boolean(busy)}
                            onCheck={link.onCheck}
                            onAccess={link.onAccess}
                            onRemove={link.onRemove}
                        />
                    ))
                ) : (
                    <Span className="text-[12px] leading-4 text-ink-secondary">
                        Not mounted anywhere yet. Pick a computer or a
                        workspace, and its bots see the folder.
                    </Span>
                )}
                <InlineAddSelect
                    id={`host-directory-${directory.id}-computer`}
                    noun="computer"
                    options={addable_computers}
                    loading={busy == "add-computer"}
                    onAdd={({ value }) =>
                        post({
                            path: "link-host-directory",
                            key: "add-computer",
                            body: { computer_id: Number(value) },
                        })
                    }
                />
                <InlineAddSelect
                    id={`host-directory-${directory.id}-workspace`}
                    noun="workspace"
                    options={addable_workspaces}
                    loading={busy == "add-workspace"}
                    onAdd={({ value }) =>
                        post({
                            path: "link-host-directory",
                            key: "add-workspace",
                            body: { workspace_id: Number(value) },
                        })
                    }
                />
            </Stack>
        </Stack>
    );
}