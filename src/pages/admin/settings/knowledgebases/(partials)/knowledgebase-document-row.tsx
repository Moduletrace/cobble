import { FileText, NotebookPen, Pencil, Trash2 } from "lucide-react";
import Row from "@moduletrace/twui/layout/Row";
import IconTile from "@/src/components/general/icon-tile";
import RowIconButton from "@/src/components/general/row-icon-button";
import type { KnowledgebaseDocument } from "@/src/types";
import SettingsListRow from "../../(partials)/settings-list-row";
import knowledgebaseIndexState from "@/src/utils/knowledgebase-index-state";
import knowledgebaseDocumentSummary from "../(functions)/knowledgebase-document-summary";
import IndexStateMark from "./index-state-mark";

type Props = {
    document: KnowledgebaseDocument;
    embedding_model: string | null;
    busy?: boolean;
    /**
     * Opens a text document to edit; not given for a file or when the user
     * can't edit.
     */
    onEdit?: () => void;
    onDelete?: () => void;
};

/**
 * One document in a knowledgebase: what it is and how much of it bots can
 * search, or why it couldn't be read.
 */
export default function KnowledgebaseDocumentRow({ document, embedding_model, busy, onEdit, onDelete }: Props) {
    return (
        <SettingsListRow
            avatar={<IconTile Icon={document.source == "text" ? NotebookPen : FileText} />}
            title={document.name}
            title_icon={
                <IndexStateMark
                    state={knowledgebaseIndexState({
                        total: 1,
                        indexing: document.indexing ? 1 : 0,
                        failed: document.ingest_error ? 1 : 0,
                        stale: document.embedding_model && document.embedding_model == embedding_model ? 0 : 1,
                        embedding_model,
                    })}
                    label={document.ingest_error && !document.indexing ? document.ingest_error : undefined}
                />
            }
            subtitle={knowledgebaseDocumentSummary({ document, embedding_model })}
        >
            <Row className="gap-0! flex-nowrap">
                {onEdit ? <RowIconButton icon={Pencil} title={`Edit ${document.name}`} disabled={busy} onClick={onEdit} /> : null}
                {onDelete ? (
                    <RowIconButton icon={Trash2} title={`Delete ${document.name}`} disabled={busy} onClick={onDelete} />
                ) : null}
            </Row>
        </SettingsListRow>
    );
}
