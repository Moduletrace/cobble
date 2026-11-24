import { useContext, useState } from "react";
import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { Check, Copy, KeyRound, RefreshCw } from "lucide-react";
import { AppContext } from "@/src/pages/__root";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import SettingsGroup from "../../(partials)/settings-group";
import SettingsStatus from "../../(partials)/settings-status";
import PasteSshKeyForm from "../(partials)/paste-ssh-key-form";

/**
 * Settings section for the install-wide SSH key used to reach SSH servers.
 * Super admins can view the public key, generate a new pair, or paste a key.
 */
export default function SshKeyGroup() {
    const { pageProps } = useContext(AppContext);
    const [publicKey, setPublicKey] = useState<string | null>(pageProps?.ssh_key?.public_key || null);
    const [copied, setCopied] = useState(false);
    const [showPaste, setShowPaste] = useState(false);
    const [busy, setBusy] = useState(false);
    const [status, setStatus] = useState<{ error?: boolean; success?: boolean; msg?: string }>();

    const copyKey = async () => {
        if (!publicKey) return;
        await navigator.clipboard.writeText(publicKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const generateKey = async () => {
        if (publicKey && !window.confirm("Replace the existing SSH key? Any servers with the old key must be updated.")) {
            return;
        }
        setBusy(true);
        setStatus(undefined);
        const res = await postAdminApi<{ public_key: string }>({
            path: "computers/generate-ssh-key",
            body: {},
        });
        setBusy(false);
        if (res.success && res.singleRes?.public_key) {
            setPublicKey(res.singleRes.public_key);
            setShowPaste(false);
            setStatus({ success: true, msg: "New SSH key generated." });
        } else {
            setStatus({ error: true, msg: res.msg || "Failed to generate key." });
        }
    };

    return (
        <SettingsGroup
            id="ssh-key"
            title="Install SSH key"
            description="The SSH keypair used by bots to connect to SSH servers. Add the public key to ~/.ssh/authorized_keys on each server."
        >
            <Stack className="w-full gap-3! items-stretch">
                {publicKey ? (
                    <Stack className="gap-2! p-3 rounded-default border border-solid border-hairline bg-surface">
                        <Row className="items-center justify-between">
                            <Row className="items-center gap-1.5 text-xs font-semibold text-ink">
                                <KeyRound size={14} className="text-emerald-500" />
                                <span>Key active</span>
                            </Row>
                            <Button
                                title="Copy public key"
                                type="button"
                                variant="ghost"
                                color="gray"
                                size="small"
                                onClick={copyKey}
                            >
                                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                <span className="ml-1">{copied ? "Copied" : "Copy public key"}</span>
                            </Button>
                        </Row>
                        <Span className="font-mono text-xs break-all text-ink-secondary select-all bg-sunken p-2 rounded-default">
                            {publicKey}
                        </Span>
                    </Stack>
                ) : (
                    <Span className="text-sm text-ink-secondary">
                        No SSH key generated yet. Generate or paste a key to connect to SSH servers.
                    </Span>
                )}

                {showPaste ? (
                    <PasteSshKeyForm
                        onSaved={(key) => {
                            setPublicKey(key);
                            setShowPaste(false);
                            setStatus({ success: true, msg: "SSH key saved." });
                        }}
                        onCancel={() => setShowPaste(false)}
                    />
                ) : (
                    <Row className="gap-2! flex-wrap items-center">
                        <Button
                            title={publicKey ? "Generate a new SSH key" : "Generate an SSH key"}
                            type="button"
                            variant="ghost"
                            color="gray"
                            size="small"
                            onClick={generateKey}
                            disabled={busy}
                        >
                            <RefreshCw size={13} className={busy ? "animate-spin mr-1" : "mr-1"} />
                            {publicKey ? "Generate new key" : "Generate key"}
                        </Button>
                        <Button
                            title="Paste an existing private key"
                            type="button"
                            variant="ghost"
                            color="gray"
                            size="small"
                            onClick={() => setShowPaste(true)}
                            disabled={busy}
                        >
                            Paste private key
                        </Button>
                    </Row>
                )}
                {status ? <SettingsStatus status={status} /> : null}
            </Stack>
        </SettingsGroup>
    );
}
