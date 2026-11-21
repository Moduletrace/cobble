import { useState } from "react";
import FileUpload from "@moduletrace/twui/form/FileUpload";
import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { Check, CircleAlert, Upload } from "lucide-react";
import AddModalShell from "@/src/layouts/bots/(partials)/add-modal-shell";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import type {
    ExtensionBundle,
    ExtensionBundleKind,
    ExtensionImportAction,
    ExtensionImportApplyPayload,
    ExtensionImportOutcome,
    ExtensionImportPreview,
} from "@/src/types";
import readBundleFile from "../(functions)/read-bundle-file";
import ImportPreviewRow from "./import-preview-row";
import SettingsStatus from "./settings-status";

type Props = {
    kind: ExtensionBundleKind;
    /**
     * What the page calls its rows, e.g. "MCP servers".
     */
    label: string;
    onImported: (payload: ExtensionImportApplyPayload, msg: string) => void;
    onClose: () => void;
};

type Status = { error?: boolean; success?: boolean; msg?: string };

/**
 * Importing a bundle the page's own export made: pick the file, read what
 * it holds and what this install already has, choose per item, then write.
 * Only this page's kind goes in; the rest is left for its own page.
 */
export default function ImportBundleModal({ kind, label, onImported, onClose }: Props) {
    const [bundle, setBundle] = useState<ExtensionBundle>();
    const [preview, setPreview] = useState<ExtensionImportPreview>();
    const [actions, setActions] = useState<Record<number, ExtensionImportAction>>({});
    const [outcomes, setOutcomes] = useState<ExtensionImportOutcome[]>();
    const [status, setStatus] = useState<Status>();
    const [busy, setBusy] = useState(false);

    const read = async ({ file }: { file?: File }) => {
        if (!file || busy) return;

        setBusy(true);
        setStatus(undefined);

        const read_file = await readBundleFile({ file });

        if (!read_file.bundle) {
            setBusy(false);
            setStatus({ error: true, msg: read_file.problem || "That file can't be read." });
            return;
        }

        const res = await postAdminApi<ExtensionImportPreview>({
            path: "extensions/preview-import",
            body: { bundle: read_file.bundle, kind },
        });

        setBusy(false);

        if (!res.singleRes) {
            setStatus({ error: true, msg: res.msg || "That file can't be read." });
            return;
        }

        setBundle(read_file.bundle);
        setPreview(res.singleRes);
        setActions(
            Object.fromEntries(
                res.singleRes.items.map((item) => [item.index, item.status == "new" ? "add" : "skip"] as const),
            ),
        );
        setStatus(res.success ? undefined : { error: false, success: false, msg: res.msg });
    };

    const apply = async () => {
        if (!bundle || !preview || busy) return;

        setBusy(true);
        const res = await postAdminApi<ExtensionImportApplyPayload>({
            path: "extensions/apply-import",
            body: {
                bundle,
                kind,
                decisions: Object.entries(actions).map(([index, action]) => ({ index: Number(index), action })),
            },
        });
        setBusy(false);

        if (!res.success || !res.singleRes) {
            setStatus({ error: true, msg: res.msg || "That didn't work." });
            return;
        }

        setOutcomes(res.singleRes.outcomes);
        onImported(res.singleRes, res.msg || "Imported.");
    };

    const title = outcomes ? "Imported" : preview ? `What would come in from this file` : `Import ${label}`;

    return (
        <AddModalShell
            open
            setOpen={(open) => {
                if (!open) onClose();
            }}
            title={title}
            description={
                outcomes
                    ? undefined
                    : preview
                      ? "Nothing has been written yet. Pick what to do with each item, then import."
                      : `A JSON file exported from another install's ${label} settings page. It brings settings, never keys or who gets them.`
            }
        >
            <Stack className="w-full gap-3! items-stretch pt-2">
                {outcomes ? (
                    <>
                        <Stack className="w-full gap-1! items-stretch">
                            {outcomes.map((outcome) => (
                                <Row key={outcome.index} className="w-full items-start gap-2! flex-nowrap">
                                    {outcome.ok ? (
                                        <Check size={14} aria-hidden className="shrink-0 mt-0.5 text-ink-secondary" />
                                    ) : (
                                        <CircleAlert size={14} aria-hidden className="shrink-0 mt-0.5 text-ink" />
                                    )}
                                    <Stack className="grow min-w-0 gap-0!">
                                        <Span className="text-[13px] leading-[18px] font-bold text-ink truncate w-full">
                                            {outcome.name}
                                        </Span>
                                        <Span className="text-xs leading-4 text-ink-secondary">{outcome.msg}</Span>
                                    </Stack>
                                </Row>
                            ))}
                        </Stack>
                        <Button
                            title="Close"
                            type="button"
                            color="gray"
                            variant="outlined"
                            size="small"
                            onClick={onClose}
                            className="self-end"
                        >
                            Close
                        </Button>
                    </>
                ) : preview ? (
                    <>
                        <Span className="text-[13px] leading-[18px] text-ink-secondary">{summary({ preview })}</Span>
                        <Stack className="w-full gap-0! items-stretch max-h-[46vh] overflow-y-auto">
                            {preview.items.map((item) => (
                                <ImportPreviewRow
                                    key={item.index}
                                    item={item}
                                    action={actions[item.index] || "skip"}
                                    onAction={(action) =>
                                        setActions((prev) => ({ ...prev, [item.index]: action }))
                                    }
                                />
                            ))}
                        </Stack>
                        <Row className="w-full justify-end gap-2! flex-nowrap">
                            <Button
                                title="Pick another file"
                                type="button"
                                color="gray"
                                variant="ghost"
                                size="small"
                                onClick={() => {
                                    setPreview(undefined);
                                    setBundle(undefined);
                                    setStatus(undefined);
                                }}
                            >
                                Pick another file
                            </Button>
                            <Button
                                title="Import what's chosen"
                                type="button"
                                color="primary"
                                variant="normal"
                                size="small"
                                loading={busy}
                                disabled={busy}
                                onClick={apply}
                            >
                                Import
                            </Button>
                        </Row>
                    </>
                ) : (
                    <>
                        <FileUpload
                            label={`A file of ${label} (.json)`}
                            className="h-[160px]"
                            fileInputProps={{ accept: ".json,application/json" }}
                            changeHandler={(file_data) => read({ file: file_data?.file })}
                        />
                        {busy ? (
                            <Row className="w-full items-center gap-2!">
                                <Upload size={14} aria-hidden className="text-ink-secondary" />
                                <Span className="text-[13px] leading-[18px] text-ink-secondary">Reading the file...</Span>
                            </Row>
                        ) : null}
                    </>
                )}
                <SettingsStatus status={status} />
            </Stack>
        </AddModalShell>
    );
}

function summary({ preview }: { preview: ExtensionImportPreview }) {
    const parts = [
        preview.counts.new ? `${preview.counts.new} new` : "",
        preview.counts.same ? `${preview.counts.same} already here` : "",
        preview.counts.conflict ? `${preview.counts.conflict} different here` : "",
        preview.counts.invalid ? `${preview.counts.invalid} can't be read` : "",
    ].filter(Boolean);

    const others = preview.other_kinds
        ? ` The file also holds ${preview.other_kinds} ${preview.other_kinds == 1 ? "item" : "items"} for other pages.`
        : "";

    return `${parts.length ? parts.join(", ") : "Nothing"} in this file.${others}`;
}