import { useContext, useState } from "react";
import Button from "@moduletrace/twui/layout/Button";
import { Plus } from "lucide-react";
import { AppContext } from "@/src/pages/__root";
import useLiveComputers from "@/src/hooks/use-live-computers";
import { AddFlowContext } from "@/src/layouts/bots/(data)/add-flow-context";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import type { ComputerWithStatus } from "@/src/types";
import isPassThroughUser from "@/src/utils/rbac/is-pass-through-user";
import SettingsGroup from "../../(partials)/settings-group";
import SettingsList from "../../(partials)/settings-list";
import SettingsStatus from "../../(partials)/settings-status";
import ComputerSettingsRow from "../(partials)/computer-settings-row";

type Status = { error?: boolean; success?: boolean; msg?: string };

/**
 * Every computer the user has, main first, kept live: its state and
 * resources. A row opens that computer's settings page; super admins
 * create, retry and delete them from here too.
 */
export default function ComputersSettingsSection() {
    const { pageProps } = useContext(AppContext);
    const { openForm } = useContext(AddFlowContext);
    const { computers, setComputers } = useLiveComputers({
        computers: pageProps?.computers || [],
        include_new: true,
    });
    const [busy, setBusy] = useState(false);
    const [status, setStatus] = useState<Status>();

    const is_super_admin = isPassThroughUser({
        user_types: pageProps?.user_types,
    });

    const merge = (fresh: ComputerWithStatus) =>
        setComputers((prev) =>
            prev.map((c) => (c.id == fresh.id ? { ...c, ...fresh } : c)),
        );

    const run = async ({
        path,
        computer_id,
    }: {
        path: string;
        computer_id: number;
    }) => {
        setBusy(true);
        setStatus(undefined);

        const res = await postAdminApi<ComputerWithStatus>({
            path,
            body: { computer_id },
        });

        setBusy(false);

        if (!res.success) {
            setStatus({ error: true, msg: res.msg || "That didn't work." });
            return;
        }

        if (res.singleRes) merge(res.singleRes);
        else setComputers((prev) => prev.filter((c) => c.id != computer_id));

        setStatus(res.msg ? { success: true, msg: res.msg } : undefined);
    };

    return (
        <SettingsGroup
            title="Your computers"
            description="Each one is a sandbox container on this machine. Bots reach them through workspaces or direct access."
        >
            <SettingsList is_empty={!computers.length} empty="No computers yet.">
                {computers.map((computer) => (
                    <ComputerSettingsRow
                        key={computer.id}
                        computer={computer}
                        is_super_admin={is_super_admin}
                        busy={busy}
                        onRetry={() =>
                            run({
                                path: "computers/retry-computer",
                                computer_id: Number(computer.id),
                            })
                        }
                        onDelete={() => {
                            if (
                                !window.confirm(
                                    `Delete ${computer.name || "this computer"}? Its container goes; its files stay on disk.`,
                                )
                            )
                                return;

                            run({
                                path: "computers/delete-computer",
                                computer_id: Number(computer.id),
                            });
                        }}
                    />
                ))}
            </SettingsList>
            {is_super_admin ? (
                <Button
                    title="Create a new computer"
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
