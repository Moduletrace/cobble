import { useState } from "react";
import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import Stack from "@moduletrace/twui/layout/Stack";
import Span from "@moduletrace/twui/layout/Span";
import Input from "@moduletrace/twui/form/Input";
import Form from "@moduletrace/twui/form/Form";
import Checkbox from "@moduletrace/twui/form/Checkbox";
import SearchSelect from "@moduletrace/twui/form/SearchSelect";
import { CircleSlash, ExternalLink, RefreshCw } from "lucide-react";
import AddModalShell from "@/src/layouts/bots/(partials)/add-modal-shell";
import AddFormActions from "@/src/layouts/bots/(partials)/add-form-actions";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import type { ConnectorAccountRecord, ConnectorRecord, ExtensionTargets } from "@/src/types";
import useConnectorConnect from "../(hooks)/use-connector-connect";

type Props = {
    connector: ConnectorRecord;
    account: ConnectorAccountRecord;
    targets: ExtensionTargets;
    bots: { id: number; name: string }[];
    onSaved: (msg: string) => void;
    onCancel: () => void;
};

/**
 * One sign-in: what it's called, and where it may be used. Its owner's runs
 * always may; the owner gives it to workspaces or bots they reach, and a
 * super admin may give it to every run.
 */
export default function ConnectorAccountModal({ connector, account, targets, bots, onSaved, onCancel }: Props) {
    const [label, setLabel] = useState(account.label);
    const [workspace_ids, setWorkspaceIds] = useState<number[]>(account.workspace_ids);
    const [bot_ids, setBotIds] = useState<number[]>(account.bot_ids);
    const [all_bots, setAllBots] = useState(account.all_bots);
    const [busy, setBusy] = useState<"save" | "disconnect">();
    const [error, setError] = useState("");
    const [reconnect_error, setReconnectError] = useState("");
    const connect = useConnectorConnect({
        onConnected: onSaved,
        onError: (msg) => setReconnectError(msg),
    });


    const save = async () => {
        if (busy) return;

        setBusy("save");
        setError("");

        if (label.trim() != account.label) {
            const renamed = await postAdminApi<ConnectorAccountRecord>({
                path: "connectors/save-account",
                body: { account_id: account.id, label: label.trim() },
            });

            if (!renamed.success) {
                setBusy(undefined);
                setError(renamed.msg || "Couldn't save the name.");
                return;
            }
        }

        const res = await postAdminApi<ConnectorAccountRecord>({
            path: "connectors/set-account-access",
            body: { account_id: account.id, workspace_ids, bot_ids, all_bots },
        });

        setBusy(undefined);

        if (!res.success) {
            setError(res.msg || "Couldn't save where it is used.");
            return;
        }

        onSaved(res.msg || `Saved ${label.trim()}.`);
    };

    const disconnect = async () => {
        if (busy) return;
        if (!window.confirm(`Disconnect ${account.label}? Runs using it lose it at once.`)) return;

        setBusy("disconnect");

        const res = await postAdminApi({
            path: "connectors/disconnect-account",
            body: { account_id: account.id },
        });

        setBusy(undefined);

        if (!res.success) {
            setError(res.msg || "Couldn't disconnect it.");
            return;
        }

        onSaved(res.msg || "Disconnected.");
    };

    return (
        <AddModalShell
            open
            setOpen={(next) => {
                if (!next) onCancel();
            }}
            title={`${connector.name} account`}
            description="The provider keeps the credentials. Here is its name, and where your bots may use it."
        >
            <Form className="w-full flex-col gap-4! items-stretch" submitHandler={save}>
                <Input
                    id={`connector-account-${account.id}-label`}
                    title="Account name"
                    label="Account name"
                    showLabel
                    value={label}
                    autoComplete="off"
                    onChange={(e) => setLabel(e.target.value)}
                    info="So you can tell two accounts of the same app apart."
                />

                {targets.can_edit ? (
                    <Checkbox
                        id={`connector-account-${account.id}-all-bots`}
                        title="Every bot, every user"
                        label="Every bot, every user"
                        checked={all_bots}
                        clickDispatchHandler={(value) => setAllBots(value)}
                        info="Off, the account stays yours, and only the places below may use it."
                    />
                ) : null}

                <SearchSelect
                    id={`connector-account-${account.id}-bots`}
                    title="Bots"
                    label="Your bots"
                    showLabel
                    multiple
                    options={bots.map((bot) => ({ value: String(bot.id), title: bot.name }))}
                    defaultValues={bot_ids.map(String)}
                    changeHandler={(value) =>
                        setBotIds((Array.isArray(value) ? value : [value]).map(Number).filter(Boolean))
                    }
                    info="Every run on these bots may use the account, whoever it belongs to."
                />

                <SearchSelect
                    id={`connector-account-${account.id}-workspaces`}
                    title="Workspaces"
                    label="Workspaces"
                    showLabel
                    multiple
                    options={targets.workspaces.map((workspace) => ({
                        value: String(workspace.id),
                        title: workspace.name,
                    }))}
                    defaultValues={workspace_ids.map(String)}
                    changeHandler={(value) =>
                        setWorkspaceIds((Array.isArray(value) ? value : [value]).map(Number).filter(Boolean))
                    }
                    info="Every bot working in these workspaces may use the account."
                />

                {account.status != "connected" ? (
                    <Stack className="w-full gap-2 rounded-default border border-hairline p-3">
                        <Span className="text-sm">
                            This sign-in is no longer connected. Reconnect puts a fresh one in its place, under the same name
                            and tool names.
                        </Span>
                        <Row className="flex-wrap items-center gap-2!">
                            <Button
                                title={`Reconnect ${account.label}`}
                                type="button"
                                variant="outlined"
                                size="small"
                                className="gap-1!"
                                loading={connect.busy}
                                onClick={() => {
                                    setReconnectError("");
                                    connect.start({ connector_id: connector.id, label: account.label, account_id: account.id });
                                }}
                            >
                                <RefreshCw size={14} aria-hidden />
                                Reconnect
                            </Button>
                            {connect.sign_in ? (
                                <Button
                                    title={`Open the ${connect.sign_in.label} sign-in page`}
                                    href={connect.sign_in.url}
                                    target="_blank"
                                    linkProps={{ rel: "noopener noreferrer" }}
                                    variant="ghost"
                                    color="gray"
                                    size="small"
                                    className="gap-1!"
                                >
                                    <ExternalLink size={14} aria-hidden />
                                    Open the sign-in page
                                </Button>
                            ) : null}
                        </Row>
                        {reconnect_error ? <Span className="text-sm text-hue-red">{reconnect_error}</Span> : null}
                    </Stack>
                ) : null}

                <Row className="w-full items-center justify-between gap-2!">
                    <Button
                        title={`Disconnect ${account.label}`}
                        type="button"
                        variant="ghost"
                        color="gray"
                        size="small"
                        className="gap-1!"
                        loading={busy == "disconnect"}
                        onClick={disconnect}
                    >
                        <CircleSlash size={14} aria-hidden />
                        Disconnect
                    </Button>
                    <Span className="text-xs text-ink-secondary">
                        {account.owner_name ? `Connected by ${account.owner_name}` : ""}
                    </Span>
                </Row>

                <AddFormActions
                    submit_label="Save"
                    loading={busy == "save"}
                    error={error}
                    onCancel={onCancel}
                />
            </Form>
        </AddModalShell>
    );
}