import { useState } from "react";
import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import Stack from "@moduletrace/twui/layout/Stack";
import CodeEditor from "@/src/components/general/code-editor";
import AddModalShell from "@/src/layouts/bots/(partials)/add-modal-shell";
import type { ExtensionBundleKind } from "@/src/types";
import readExtensionPaste, { ExtensionPasteLabels, type ExtensionPaste } from "@/src/utils/read-extension-paste";
import SettingsStatus from "./settings-status";

type Props = {
    kind: ExtensionBundleKind;
    /**
     * The JSON read: the item, and what the form now holds that the user
     * has to know about.
     */
    onFill: (result: { paste: ExtensionPaste; notice: string }) => void;
    onCancel: () => void;
};

/**
 * The JSON one item is copied as, pasted into its Add form: one item, or
 * a whole export. Its button opens this; the form fills when it reads.
 */
export default function PasteExtensionModal({ kind, onFill, onCancel }: Props) {
    const [text, setText] = useState("");
    const [error, setError] = useState<string>();
    const labels = ExtensionPasteLabels[kind];

    const fill = () => {
        const result = readExtensionPaste({ kind, text });

        if (!result.ok) {
            setError(result.problem);
            return;
        }

        const notice = [filled({ paste: result.paste }), pasteNotes({ paste: result.paste })]
            .filter(Boolean)
            .join("\n");

        onFill({ paste: result.paste, notice });
        onCancel();
    };

    return (
        <AddModalShell
            open
            setOpen={(next) => !next && onCancel()}
            title={`Paste ${labels.one} JSON`}
            description={`Copy one from another install's menu, or paste a whole export. It fills this form; nothing is saved until you add it.`}
        >
            <Stack className="w-full gap-3! items-stretch pt-4">
                <CodeEditor
                    mode="json"
                    className="h-64"
                    title="JSON"
                    placeholder={`{"kind": "${kind}", "key": "github", "config": { ... }}`}
                    info="One item's JSON, or a whole export."
                    onChange={(value) => setText(value)}
                />
                <SettingsStatus status={error ? { error: true, msg: error } : undefined} />
                <Row className="gap-2! flex-nowrap justify-end">
                    <Button
                        title="Cancel"
                        type="button"
                        variant="ghost"
                        color="gray"
                        size="small"
                        onClick={onCancel}
                    >
                        Cancel
                    </Button>
                    <Button title="Fill the form" type="button" size="small" disabled={!text.trim()} onClick={fill}>
                        Fill the form
                    </Button>
                </Row>
            </Stack>
        </AddModalShell>
    );
}

/**
 * What the paste read, in one line.
 */
function filled({ paste }: { paste: ExtensionPaste }) {
    const name = paste.config.name || paste.key;
    const labels = ExtensionPasteLabels[paste.kind];
    const others = paste.left
        ? ` The JSON holds ${paste.left} more ${labels.many}, and this filled the first.`
        : "";

    return `Filled the form from ${name}.${others}`;
}

/**
 * What the form now holds that the user has to know about: values the
 * export left out, env keys it uses, and documents that come with it.
 */
function pasteNotes({ paste }: { paste: ExtensionPaste }) {
    const documents = paste.item.documents.length;
    const lines = [
        paste.item.redacted.length ? `The export left out ${paste.item.redacted.join(", ")}. Fill it in here.` : "",
        paste.item.env_keys.length
            ? `It uses the env keys ${paste.item.env_keys.join(", ")} (Settings > Environment).`
            : "",
        ...paste.item.notes,
        documents
            ? `${documents} ${documents == 1 ? "document comes" : "documents come"} with it, added when you save.`
            : "",
    ].filter(Boolean);

    return lines.join("\n");
}