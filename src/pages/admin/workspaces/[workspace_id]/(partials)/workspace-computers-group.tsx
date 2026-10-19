import { useContext, useState } from "react";
import Button from "@moduletrace/twui/layout/Button";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { Plus } from "lucide-react";
import { AppContext } from "@/src/pages/__root";
import type { ComputerWithStatus } from "@/src/types";
import isPassThroughUser from "@/src/utils/rbac/is-pass-through-user";
import { AddFlowContext } from "@/src/layouts/bots/(data)/add-flow-context";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import SettingsGroup from "@/src/pages/admin/settings/(partials)/settings-group";
import SettingsStatus from "@/src/pages/admin/settings/(partials)/settings-status";
import useLiveComputers from "../(hooks)/use-live-computers";
import InlineAddSelect from "./inline-add-select";
import WorkspaceComputerRow from "./workspace-computer-row";

type Props = {
    workspace_id: number;
    /**
     * Linked to the workspace, its default first.
     */
    computers: ComputerWithStatus[];
    /**
     * Every computer the user has.
     */
    all_computers: ComputerWithStatus[];
};

type Status = { error?: boolean; success?: boolean; msg?: string };

/**
 * The computers bots work on here. Tasks run on the default unless a bot
 * picks another; with none, tasks needing a computer can't run. Unlinking
 * keeps the computer; deleting it (super admins) keeps its files.
 */
export default function WorkspaceComputersGroup({ workspace_id, computers: initial, all_computers }: Props) {
    const { pageProps } = useContext(AppContext);
    const { openForm } = useContext(AddFlowContext);
    const { computers, setComputers } = useLiveComputers({ computers: initial });
    const [busy, setBusy] = useState(false);
    const [status, setStatus] = useState<Status>();

    const is_super_admin = isPassThroughUser({ user_types: pageProps?.user_types });
    const default_id = computers[0]?.id;
    const addable = all_computers.filter((computer) => !computers.some((c) => c.id == computer.id));

    const run = async ({ path, computer_id }: { path: string; computer_id: number }) => {
        setBusy(true);
        setStatus(undefined);

        const res = await postAdminApi<ComputerWithStatus>({
            path,
            body: { workspace_id, computer_id },
        });

        setBusy(false);

        if (!res.success) {
            setStatus({ error: true, msg: res.msg || "That didn't work." });
            return;
        }

        if (res.payload) {
            setComputers(res.payload);
        } else if (res.singleRes) {
            const fresh = res.singleRes;
            setComputers((prev) => prev.map((c) => (c.id == fresh.id ? { ...c, ...fresh } : c)));
        } else {
            setComputers((prev) => prev.filter((c) => c.id != computer_id));
        }

        setStatus(res.msg ? { success: true, msg: res.msg } : undefined);
    };

    return (
        <SettingsGroup
            title="Computers"
            description="Bots here work on these. Their tasks run on the default one unless they pick another."
        >
            <Stack className="w-full py-1 gap-0! items-stretch rounded-default border border-solid border-hairline bg-surface">
                {computers.map((computer) => (
                    <WorkspaceComputerRow
                        key={computer.id}
                        computer={computer}
                        is_default={computer.id == default_id}
                        is_super_admin={is_super_admin}
                        busy={busy}
                        onMakeDefault={() => run({ path: "workspaces/set-computer", computer_id: Number(computer.id) })}
                        onUnlink={() => run({ path: "workspaces/remove-computer", computer_id: Number(computer.id) })}
                        onRetry={() => run({ path: "computers/retry-computer", computer_id: Number(computer.id) })}
                        onDelete={() => {
                            if (!window.confirm(`Delete ${computer.name || "this computer"}? Its container goes; its files stay on disk.`)) return;

                            run({ path: "computers/delete-computer", computer_id: Number(computer.id) });
                        }}
                    />
                ))}
                {computers.length ? null : (
                    <Span className="px-4 py-4 text-[13px] leading-[18px] text-ink-secondary">
                        No computers yet. Bots here can chat, but tasks that need a computer can't run.
                    </Span>
                )}
            </Stack>
            <InlineAddSelect
                id="workspace-add-computer"
                noun="computer"
                options={addable.map((c) => ({ value: String(c.id), title: c.name || `Computer ${c.id}` }))}
                loading={busy}
                onAdd={({ value }) => run({ path: "workspaces/add-computer", computer_id: Number(value) })}
            />
            {is_super_admin ? (
                <Button
                    title="Create a new computer for this workspace"
                    type="button"
                    variant="ghost"
                    color="gray"
                    size="small"
                    onClick={() => openForm({ kind: "computer" })}
                    className="self-start gap-1!"
                >
                    <Plus size={14} aria-hidden />
                    New computer
                </Button>
            ) : null}
            <SettingsStatus status={status} />
        </SettingsGroup>
    );
}
