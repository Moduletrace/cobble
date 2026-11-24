import { useState } from "react";
import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import type { ComputerWithStatus } from "@/src/types";
import SettingsGroup from "../../../(partials)/settings-group";
import SettingsStatus from "../../../(partials)/settings-status";

type Props = {
    computer: ComputerWithStatus;
};

type Status = { error?: boolean; success?: boolean; msg?: string };

/**
 * An SSH computer's address and host key: test that the install's key
 * signs in, and forget the key it trusts when the server was rebuilt.
 */
export default function ComputerSshGroup({ computer }: Props) {
    const [busy, setBusy] = useState<"test" | "forget">();
    const [status, setStatus] = useState<Status>();
    const name = computer.name || "this server";

    const test = async () => {
        setBusy("test");
        setStatus(undefined);

        const res = await postAdminApi<{ uname: string; home: string }>({
            path: "computers/test-computer",
            body: { computer_id: computer.id },
        });

        setBusy(undefined);

        if (!res.success) {
            setStatus({ error: true, msg: res.msg || "Couldn't reach it." });
            return;
        }

        setStatus({
            success: true,
            msg: res.msg
                ? `${res.msg}${res.singleRes?.home ? ` Home: ${res.singleRes.home}` : ""}`
                : "Connected.",
        });
    };

    const forget = async () => {
        if (
            !window.confirm(
                `Forget the host key trusted for ${name}? The next connection trusts whichever key it presents.`,
            )
        )
            return;

        setBusy("forget");
        setStatus(undefined);

        const res = await postAdminApi({
            path: "computers/forget-ssh-host-key",
            body: { computer_id: computer.id },
        });

        setBusy(undefined);
        setStatus(
            res.success
                ? { success: true, msg: res.msg || "Host key forgotten." }
                : { error: true, msg: res.msg || "Couldn't forget it." },
        );
    };

    return (
        <SettingsGroup
            id="ssh"
            title="Connection"
            description="Bots sign in with the install's SSH key as this user, and run commands with its privileges."
        >
            <Stack className="w-full gap-0! items-start">
                <Span className="text-sm leading-5 text-ink font-bold">
                    {computer.ssh_user || "No user"}@{computer.ssh_host || "no host"}
                    {computer.ssh_port && Number(computer.ssh_port) != 22 ? `:${computer.ssh_port}` : ""}
                </Span>
                <Span className="text-[13px] leading-[18px] text-ink-secondary">
                    {computer.ssh_fingerprint
                        ? "The host key is trusted. Forget it only if the server's key changed."
                        : "The host key is trusted when it first connects."}
                </Span>
            </Stack>
            <Row className="w-full gap-2! flex-wrap items-center">
                <Button
                    title={`Test the connection to ${name}`}
                    type="button"
                    variant="outlined"
                    color="gray"
                    size="small"
                    loading={busy == "test"}
                    disabled={Boolean(busy)}
                    onClick={test}
                >
                    Test connection
                </Button>
                <Button
                    title={`Forget the host key trusted for ${name}`}
                    type="button"
                    variant="outlined"
                    color="gray"
                    size="small"
                    loading={busy == "forget"}
                    disabled={Boolean(busy)}
                    onClick={forget}
                >
                    Forget host key
                </Button>
            </Row>
            <SettingsStatus status={status} />
        </SettingsGroup>
    );
}