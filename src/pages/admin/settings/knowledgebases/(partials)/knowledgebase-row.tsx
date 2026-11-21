import { useState } from "react";
import Stack from "@moduletrace/twui/layout/Stack";
import { FileText, Library, Pencil, RefreshCw, RotateCcw, Trash2, Users } from "lucide-react";
import IconTile from "@/src/components/general/icon-tile";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import type { ExtensionTargets, KnowledgebasesOverviewPayload, PublicKnowledgebase } from "@/src/types";
import ExtensionAccessModal from "../../(partials)/extension-access-modal";
import SettingsListRow from "../../(partials)/settings-list-row";
import SettingsRowMenu from "../../(partials)/settings-row-menu";
import SettingsRowMenuItem from "../../(partials)/settings-row-menu-item";
import SettingsRowMenuPanel from "../../(partials)/settings-row-menu-panel";
import CopyExtensionMenuItem from "../../(partials)/copy-extension-menu-item";
import extensionAccessLabel from "../../(utils)/extension-access-label";
import updatedAgo from "../../(utils)/updated-ago";
import knowledgebaseIndexState from "@/src/utils/knowledgebase-index-state";
import knowledgebaseSummary from "../(functions)/knowledgebase-summary";
import IndexStateMark from "./index-state-mark";
import KnowledgebaseDocumentsModal from "./knowledgebase-documents-modal";
import KnowledgebaseModal from "./knowledgebase-modal";

type Props = {
    knowledgebase: PublicKnowledgebase;
    targets: ExtensionTargets;
    /**
     * The install's embedding model, for the documents' lines.
     */
    embedding_model: string | null;
    onChanged: (overview: KnowledgebasesOverviewPayload, msg: string) => void;
    onError: (msg: string) => void;
    onCopied: (msg: string) => void;
    /**
     * Whether it is picked for an export.
     */
    selected?: boolean;
    onSelected?: (checked: boolean) => void;
};

/**
 * One knowledgebase: how many documents it holds and how much of them is
 * searchable, and who gets it. Its actions live in the three-dot menu:
 * documents, who gets it, and for a super admin editing, retrying the
 * ones that failed, reading every document again, and deleting it.
 */
export default function KnowledgebaseRow({ selected, onSelected, knowledgebase, targets, embedding_model, onChanged, onError, onCopied }: Props) {
    const [open, setOpen] = useState<"documents" | "edit" | "access">();
    const [busy, setBusy] = useState(false);

    const saved = (overview: KnowledgebasesOverviewPayload, msg: string) => {
        setOpen(undefined);
        onChanged(overview, msg);
    };

    const post = async ({ path, confirm }: { path: string; confirm: string }) => {
        if (busy || !window.confirm(confirm)) return;

        setBusy(true);
        const res = await postAdminApi<KnowledgebasesOverviewPayload>({
            path,
            body: { knowledgebase_id: knowledgebase.id },
        });
        setBusy(false);

        if (res.success && res.singleRes) onChanged(res.singleRes, res.msg || "Done.");
        else onError(res.msg || "That didn't work.");
    };

    /**
     * The documents changed while open: their counts on the row are
     * read again.
     */
    const closeDocuments = async () => {
        setOpen(undefined);

        const res = await postAdminApi<KnowledgebasesOverviewPayload>({ path: "knowledgebases/overview", body: {} });

        if (res.success && res.singleRes) onChanged(res.singleRes, "");
    };

    return (
        <Stack className="w-full gap-0! items-stretch border-0 border-b border-solid border-hairline last:border-b-0">
            <SettingsListRow
                selected={selected}
                onSelected={onSelected}
                avatar={<IconTile Icon={Library} />}
                title={knowledgebase.name}
                badge={knowledgebase.enabled ? undefined : "Off"}
                title_icon={
                    <IndexStateMark
                        state={knowledgebaseIndexState({
                            total: knowledgebase.document_count,
                            indexing: knowledgebase.pending_count,
                            failed: knowledgebase.warning_count,
                            stale: knowledgebase.stale_count,
                            embedding_model,
                        })}
                    />
                }
                subtitle={[
                    knowledgebaseSummary({ knowledgebase }),
                    extensionAccessLabel({ access: knowledgebase.access }),
                    updatedAgo({ at: knowledgebase.updated_at }),
                    knowledgebase.description,
                ]
                    .filter(Boolean)
                    .join(" · ")}
            >
                <SettingsRowMenu title={`${knowledgebase.name} menu`} disabled={busy}>
                    <SettingsRowMenuPanel>
                        <SettingsRowMenuItem icon={FileText} title="Documents" onClick={() => setOpen("documents")} />
                        {targets.can_edit ? (
                            <SettingsRowMenuItem icon={Pencil} title="Edit" onClick={() => setOpen("edit")} />
                        ) : null}
                        <SettingsRowMenuItem icon={Users} title="Who gets it" onClick={() => setOpen("access")} />
                        {targets.can_edit ? (
                            <CopyExtensionMenuItem
                                kind="knowledgebase"
                                id={knowledgebase.id}
                                one="knowledgebase"
                                disabled={busy}
                                onCopied={onCopied}
                                onError={onError}
                            />
                        ) : null}
                        {targets.can_edit && knowledgebase.warning_count ? (
                            <SettingsRowMenuItem
                                icon={RotateCcw}
                                title="Retry failed"
                                description={`Read again the ${knowledgebase.warning_count} ${knowledgebase.warning_count == 1 ? "document" : "documents"} that failed. The ones that already succeeded stay as they are.`}
                                onClick={() =>
                                    post({
                                        path: "knowledgebases/retry-failed-documents",
                                        confirm: `Read again the ${knowledgebase.warning_count} ${knowledgebase.warning_count == 1 ? "document" : "documents"} in ${knowledgebase.name} that failed? The ones that already succeeded stay as they are.`,
                                    })
                                }
                            />
                        ) : null}
                        {targets.can_edit && knowledgebase.document_count ? (
                            <SettingsRowMenuItem
                                icon={RefreshCw}
                                title="Re-index"
                                description="Read every document again. Bots keep finding the old passages until the new ones are in."
                                onClick={() =>
                                    post({
                                        path: "knowledgebases/reindex-knowledgebase",
                                        confirm: `Read every document in ${knowledgebase.name} again? Bots keep finding the old passages until the new ones are in.`,
                                    })
                                }
                            />
                        ) : null}
                        {targets.can_edit ? (
                            <SettingsRowMenuItem
                                icon={Trash2}
                                title="Delete"
                                description="Delete it and every document in it. Bots lose it at once."
                                onClick={() =>
                                    post({
                                        path: "knowledgebases/delete-knowledgebase",
                                        confirm: `Delete ${knowledgebase.name} and every document in it? Bots lose it at once.`,
                                    })
                                }
                            />
                        ) : null}
                    </SettingsRowMenuPanel>
                </SettingsRowMenu>
            </SettingsListRow>
            {open == "documents" ? (
                <KnowledgebaseDocumentsModal
                    knowledgebase={knowledgebase}
                    can_edit={targets.can_edit}
                    embedding_model={embedding_model}
                    onClose={closeDocuments}
                />
            ) : null}
            {open == "edit" ? (
                <KnowledgebaseModal knowledgebase={knowledgebase} onSaved={saved} onCancel={() => setOpen(undefined)} />
            ) : null}
            {open == "access" ? (
                <ExtensionAccessModal<KnowledgebasesOverviewPayload>
                    id={knowledgebase.id}
                    name={knowledgebase.name}
                    access={knowledgebase.access}
                    targets={targets}
                    path="knowledgebases/set-knowledgebase-access"
                    onSaved={saved}
                    onCancel={() => setOpen(undefined)}
                />
            ) : null}
        </Stack>
    );
}
