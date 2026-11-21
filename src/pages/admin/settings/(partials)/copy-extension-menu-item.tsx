import { useState } from "react";
import { Copy } from "lucide-react";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import type { ExtensionBundle, ExtensionBundleKind } from "@/src/types";
import copyPendingText from "@/src/utils/copy-pending-text";
import SettingsRowMenuItem from "./settings-row-menu-item";

type Props = {
    kind: ExtensionBundleKind;
    id: number;
    /**
     * What the item is called, one of them, e.g. "MCP server".
     */
    one: string;
    disabled?: boolean;
    onCopied: (msg: string) => void;
    onError: (msg: string) => void;
};

/**
 * Copies one item's JSON, the same shape an export carries, so it can be
 * pasted into its Add form on another install.
 */
export default function CopyExtensionMenuItem({ kind, id, one, disabled, onCopied, onError }: Props) {
    const [busy, setBusy] = useState(false);

    const copy = async () => {
        if (busy) return;

        setBusy(true);

        const text = (async () => {
            const res = await postAdminApi<ExtensionBundle>({
                path: "extensions/export-bundle",
                body: { kind, ids: [id] },
            });
            const item = res.singleRes?.items?.[0];

            if (!res.success || !item) throw new Error(res.msg || "That didn't work.");

            return `${JSON.stringify(item, null, 2)}\n`;
        })();

        const copied = await copyPendingText({ text }).catch((error: Error) => {
            onError(error.message || "Couldn't copy it.");
            return false;
        });

        setBusy(false);

        if (copied) onCopied(`${one} copied. Paste it into an Add form on another install.`);
    };

    return (
        <SettingsRowMenuItem
            icon={Copy}
            title={`Copy ${one}`}
            description="Its JSON, to paste into an Add form on another install."
            disabled={disabled}
            loading={busy}
            onClick={copy}
        />
    );
}