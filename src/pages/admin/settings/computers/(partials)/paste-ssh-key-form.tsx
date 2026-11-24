import { useState } from "react";
import Button from "@moduletrace/twui/layout/Button";
import Form from "@moduletrace/twui/form/Form";
import Input from "@moduletrace/twui/form/Input";
import Row from "@moduletrace/twui/layout/Row";
import Stack from "@moduletrace/twui/layout/Stack";
import Textarea from "@moduletrace/twui/form/Textarea";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import SettingsStatus from "../../(partials)/settings-status";

type Props = {
    onSaved: (publicKey: string) => void;
    onCancel: () => void;
};

/**
 * Form to paste an existing SSH private key with an optional passphrase.
 */
export default function PasteSshKeyForm({ onSaved, onCancel }: Props) {
    const [privateKey, setPrivateKey] = useState("");
    const [passphrase, setPassphrase] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string>();

    const handleSubmit = async () => {
        if (!privateKey.trim()) return;
        setBusy(true);
        setError(undefined);

        const res = await postAdminApi<{ public_key: string }>({
            path: "computers/save-ssh-key",
            body: { private_key: privateKey.trim(), passphrase: passphrase || undefined },
        });

        setBusy(false);
        if (res.success && res.singleRes?.public_key) {
            onSaved(res.singleRes.public_key);
        } else {
            setError(res.msg || "Failed to save SSH key.");
        }
    };

    return (
        <Form onSubmit={handleSubmit} className="w-full gap-3! p-4 rounded-default border border-solid border-hairline bg-surface">
            <Stack className="gap-2!">
                <Textarea
                    name="private_key"
                    label="Private key (OpenSSH or PEM)"
                    placeholder="-----BEGIN OPENSSH PRIVATE KEY-----&#10;..."
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                    rows={4}
                    required
                />
                <Input
                    name="passphrase"
                    type="password"
                    label="Passphrase (optional)"
                    placeholder="Key passphrase, if encrypted"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                />
            </Stack>
            {error ? <SettingsStatus status={{ error: true, msg: error }} /> : null}
            <Row className="gap-2! justify-end">
                <Button
                    title="Cancel paste key"
                    type="button"
                    variant="ghost"
                    color="gray"
                    size="small"
                    onClick={onCancel}
                    disabled={busy}
                >
                    Cancel
                </Button>
                <Button
                    title="Save SSH private key"
                    type="submit"
                    variant="normal"
                    color="primary"
                    size="small"
                    disabled={busy || !privateKey.trim()}
                >
                    {busy ? "Saving..." : "Save key"}
                </Button>
            </Row>
        </Form>
    );
}
