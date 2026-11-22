import { useState } from "react";
import Form from "@moduletrace/twui/form/Form";
import Input from "@moduletrace/twui/form/Input";
import SearchSelect from "@moduletrace/twui/form/SearchSelect";
import Link from "@moduletrace/twui/layout/Link";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { ConnectorProviders } from "@/src/dict/connector-dict";
import AddFormActions from "@/src/layouts/bots/(partials)/add-form-actions";
import AddModalShell from "@/src/layouts/bots/(partials)/add-modal-shell";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import type { ConnectorConnectionRecord, ConnectorConnectionsPayload } from "@/src/types";

type Props = {
    connection?: ConnectorConnectionRecord;
    onSaved: (msg: string) => void;
    onCancel: () => void;
};

/**
 * Adds a provider connection, or renames one and replaces its key. A
 * provider's key belongs to the account it was made in, so an install with
 * one Composio account for work and another for personal use has two
 * connections here, each listing only its own apps.
 */
export default function ConnectorConnectionModal({ connection, onSaved, onCancel }: Props) {
    const [provider, setProvider] = useState(connection?.provider || ConnectorProviders[0].value);
    const [name, setName] = useState(connection?.name || "");
    const [api_key, setApiKey] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string>();

    const preset = ConnectorProviders.find((entry) => entry.value == provider) || ConnectorProviders[0];

    const submit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (busy) return;

        const clean_name = name.trim();
        const clean_key = api_key.trim();

        if (!clean_name) {
            setError("Name this connection, e.g. Composio Work.");
            return;
        }

        if (!connection && !clean_key) {
            setError(`Paste the ${preset?.title || "provider"} key this connection uses.`);
            return;
        }

        setBusy(true);
        setError(undefined);

        const res = await postAdminApi<ConnectorConnectionsPayload>({
            path: "connectors/save-connection",
            body: {
                connection_id: connection?.id,
                provider,
                name: clean_name,
                ...(clean_key ? { api_key: clean_key } : {}),
            },
        });

        setBusy(false);

        if (!res.success || !res.singleRes) {
            setError(res.msg || "Couldn't save the connection.");
            return;
        }

        onSaved(res.msg || "Saved.");
    };

    return (
        <AddModalShell
            open
            setOpen={(next) => !next && onCancel()}
            title={connection ? `Edit ${connection.name}` : "Add a connection"}
            description={
                connection
                    ? "Renaming keeps its apps. A new key lists them again."
                    : "Each connection is one provider account with its own key, so a work account and a personal one live side by side. Once saved, every app that key holds is listed here: give one to every bot, a workspace or your own runs, and a workspace's apps use every account connected for them, whoever connected them."
            }
        >
            <Form className="w-full gap-4! items-stretch pt-4" onSubmit={submit}>
                <SearchSelect
                    id="connector-connection-provider"
                    title="Paradigm"
                    label="Paradigm"
                    showLabel
                    disabled={Boolean(connection)}
                    options={ConnectorProviders.map((entry) => ({ value: entry.value, title: entry.title }))}
                    defaultValues={[provider]}
                    info="How this connection's apps are reached. Composio is the first; more paradigms can come later."
                    changeHandler={(value) => {
                        if (typeof value == "string" && value) setProvider(value);
                    }}
                />
                <Input
                    id="connector-connection-name"
                    title="Name"
                    label="Name"
                    showLabel
                    placeholder="Composio Work"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <Stack className="w-full gap-1! items-stretch">
                    <Input
                        id="connector-connection-key"
                        type="password"
                        title={connection ? "Replace the key" : "API key"}
                        label={connection ? "Replace the key" : "API key"}
                        showLabel
                        placeholder={connection ? "Leave it empty to keep the saved one" : "Paste the key"}
                        value={api_key}
                        onChange={(e) => setApiKey(e.target.value)}
                    />
                    <Span className="text-xs text-ink-secondary">
                        {preset?.title || "The provider"} makes this key in its own dashboard, in the account you want to
                        work as. It stays encrypted here and never reaches a bot.
                    </Span>
                    <Span className="text-xs text-ink-secondary">{preset?.key_help}</Span>
                    <Link
                        href={preset?.key_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        showArrow
                        className="text-xs"
                    >
                        {preset?.key_url_title}
                    </Link>
                </Stack>
                <AddFormActions
                    submit_label={connection ? "Save" : "Add and list its apps"}
                    loading={busy}
                    error={error}
                    onCancel={onCancel}
                />
            </Form>
        </AddModalShell>
    );
}