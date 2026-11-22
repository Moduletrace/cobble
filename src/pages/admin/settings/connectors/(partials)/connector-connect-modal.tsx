import { useState } from "react";
import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import Stack from "@moduletrace/twui/layout/Stack";
import Span from "@moduletrace/twui/layout/Span";
import Input from "@moduletrace/twui/form/Input";
import Form from "@moduletrace/twui/form/Form";
import { ExternalLink } from "lucide-react";
import AddModalShell from "@/src/layouts/bots/(partials)/add-modal-shell";
import type { ConnectorRecord } from "@/src/types";
import ConnectorLogo from "./connector-logo";
import useConnectorConnect from "../(hooks)/use-connector-connect";

type Props = {
    connector: ConnectorRecord;
    onConnected: (msg: string) => void;
    onCancel: () => void;
};

/**
 * A new sign-in for one app: a name for it, then the provider's own page.
 * The card under the reply, not this modal, follows the sign-in to the end.
 */
export default function ConnectorConnectModal({ connector, onConnected, onCancel }: Props) {
    const [label, setLabel] = useState("");
    const [error, setError] = useState("");
    const connect = useConnectorConnect({
        onConnected,
        onError: (msg) => setError(msg),
    });

    return (
        <AddModalShell
            open
            setOpen={(next) => {
                if (!next) onCancel();
            }}
            icon={<ConnectorLogo logo={connector.logo} name={connector.name} />}
            title={`New ${connector.name} connection`}
            description="The sign-in happens at the provider, and it keeps the credentials. Your bots only ever reach the account it makes."
        >
            <Form className="w-full flex-col gap-4! items-stretch" submitHandler={() => { setError(""); connect.start({ connector_id: connector.id, label }); }}>
                <Input
                    id={`connector-${connector.id}-new-label`}
                    title="Account name"
                    label="Name this connection"
                    showLabel
                    placeholder="Work"
                    value={label}
                    autoComplete="off"
                    onChange={(e) => setLabel(e.target.value)}
                    info="What you'll call it, so you can tell two accounts of the same app apart."
                />

                {connect.sign_in ? (
                    <Row className="flex-wrap items-center gap-2!">
                        <Span className="text-xs text-ink-secondary">Didn't open?</Span>
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
                    </Row>
                ) : null}

                {error ? <Span className="text-sm text-hue-red">{error}</Span> : null}

                <Row className="w-full items-center justify-end gap-2!">
                    <Button
                        title="Close"
                        type="button"
                        variant="ghost"
                        color="gray"
                        size="small"
                        onClick={onCancel}
                    >
                        Cancel
                    </Button>
                    <Button title="Connect" type="submit" size="small" loading={connect.busy}>
                        Connect
                    </Button>
                </Row>
            </Form>
        </AddModalShell>
    );
}