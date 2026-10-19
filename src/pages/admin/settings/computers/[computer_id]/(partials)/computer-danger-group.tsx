import { useState } from "react";
import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import type { ComputerWithStatus } from "@/src/types";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import SettingsGroup from "../../../(partials)/settings-group";
import SettingsStatus from "../../../(partials)/settings-status";

type Props = {
    computer: ComputerWithStatus;
    onUpdated: (computer: ComputerWithStatus) => void;
};

type Status = { error?: boolean; success?: boolean; msg?: string };

/**
 * Setting a failed computer up again, or deleting a sandbox. Its files
 * stay on disk either way.
 */
export default function ComputerDangerGroup({
    computer,
    onUpdated,
}: Props) {
    const [busy, setBusy] = useState<"retry" | "delete">();
    const [status, setStatus] = useState<Status>();
    const name = computer.name || "this computer";
    const can_retry = computer.status == "failed";
    const can_delete = computer.kind != "main";

    const retry = async () => {
        setBusy("retry");
        setStatus(undefined);

        const res = await postAdminApi<ComputerWithStatus>({
            path: "computers/retry-computer",
            body: { computer_id: computer.id },
        });

        setBusy(undefined);

        if (!res.success) {
            setStatus({ error: true, msg: res.msg || "Couldn't set it up again." });
            return;
        }

        if (res.singleRes) onUpdated(res.singleRes);
        setStatus({ success: true, msg: res.msg || "Setting it up again." });
    };

    const remove = async () => {
        if (
            !window.confirm(
                `Delete ${name}? Its container goes; its files stay on disk.`,
            )
        )
            return;

        setBusy("delete");
        setStatus(undefined);

        const res = await postAdminApi({
            path: "computers/delete-computer",
            body: { computer_id: computer.id },
        });

        if (res.success) {
            window.location.href = "/admin/settings/computers";
            return;
        }

        setBusy(undefined);
        setStatus({ error: true, msg: res.msg || "Couldn't delete it." });
    };

    return (
        <SettingsGroup
            id="danger"
            title="Danger zone"
            description="Set a failed computer up again, or delete a sandbox. Its files stay on disk."
        >
            {can_retry || can_delete ? (
                <Row className="w-full gap-2! flex-wrap items-center">
                    {can_retry ? (
                        <Button
                            title={`Set ${name} up again`}
                            type="button"
                            variant="outlined"
                            color="gray"
                            size="small"
                            loading={busy == "retry"}
                            disabled={Boolean(busy)}
                            onClick={retry}
                        >
                            Retry setup
                        </Button>
                    ) : null}
                    {can_delete ? (
                        <Button
                            title={`Delete ${name}`}
                            type="button"
                            variant="outlined"
                            color="gray"
                            size="small"
                            loading={busy == "delete"}
                            disabled={Boolean(busy)}
                            onClick={remove}
                        >
                            Delete computer
                        </Button>
                    ) : null}
                </Row>
            ) : (
                <Span className="text-[13px] leading-[18px] text-ink-secondary">
                    Nothing to do here. The main computer stays.
                </Span>
            )}
            <SettingsStatus status={status} />
        </SettingsGroup>
    );
}
