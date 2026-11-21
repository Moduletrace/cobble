import { useState } from "react";
import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import { Download } from "lucide-react";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import type { ExtensionBundle, ExtensionBundleKind } from "@/src/types";
import downloadJsonBundle from "../(functions)/download-json-bundle";

type Props = {
    kind: ExtensionBundleKind;
    /**
     * What the page calls its rows, one and many, e.g. "MCP server" and
     * "MCP servers".
     */
    one: string;
    label: string;
    ids: number[];
    selected: number[];
    onSelectAll: () => void;
    onClear: () => void;
    onExported: (msg: string) => void;
    onError: (msg: string) => void;
};

/**
 * The line above a settings list while its rows can be picked: how many
 * are picked, Select all and Clear, and Export, which saves exactly those
 * as a JSON file another install can import.
 */
export default function ExtensionBundleBar({
    kind,
    one,
    label,
    ids,
    selected,
    onSelectAll,
    onClear,
    onExported,
    onError,
}: Props) {
    const [busy, setBusy] = useState(false);
    /** A row another action deleted is no longer picked, whatever the hook still holds. */
    const picked = selected.filter((id) => ids.includes(id));
    const all = ids.length > 0 && picked.length == ids.length;

    const export_bundle = async () => {
        if (busy || !picked.length) return;

        setBusy(true);
        const res = await postAdminApi<ExtensionBundle>({
            path: "extensions/export-bundle",
            body: { kind, ids: picked },
        });
        setBusy(false);

        if (!res.success || !res.singleRes) {
            onError(res.msg || "That didn't work.");
            return;
        }

        downloadJsonBundle({ bundle: res.singleRes, kind });
        onExported(res.msg || "Exported.");
    };

    return (
        <Row className="w-full flex-wrap items-center gap-2! border-0 border-b border-solid border-hairline pb-2">
            <Span className="text-[13px] leading-[18px] text-ink-secondary">
                {picked.length
                    ? `${picked.length} of ${ids.length} picked`
                    : `${ids.length} ${ids.length == 1 ? one : label}, none picked`}
            </Span>
            <Row className="ml-auto flex-nowrap items-center gap-1!">
                {all ? null : (
                    <Button
                        title="Pick all"
                        type="button"
                        color="gray"
                        variant="ghost"
                        size="smaller"
                        disabled={!ids.length || busy}
                        onClick={onSelectAll}
                    >
                        Select all
                    </Button>
                )}
                {picked.length ? (
                    <Button
                        title="Pick none"
                        type="button"
                        color="gray"
                        variant="ghost"
                        size="smaller"
                        disabled={busy}
                        onClick={onClear}
                    >
                        Clear
                    </Button>
                ) : null}
                <Button
                    title="Export the picked ones"
                    type="button"
                    color="gray"
                    variant="outlined"
                    size="small"
                    beforeIcon={<Download size={14} aria-hidden />}
                    loading={busy}
                    disabled={busy || !picked.length}
                    onClick={export_bundle}
                >
                    Export
                </Button>
            </Row>
        </Row>
    );
}