import { useRef, useState } from "react";
import Button from "@moduletrace/twui/layout/Button";
import Loading from "@moduletrace/twui/elements/Loading";
import Row from "@moduletrace/twui/layout/Row";
import { NotebookPen, Upload } from "lucide-react";
import { BotTextFileExtensions } from "@/src/dict/bot-file-dict";
import AddModalShell from "@/src/layouts/bots/(partials)/add-modal-shell";
import type { PublicKnowledgebase } from "@/src/types";
import SettingsList from "../../(partials)/settings-list";
import SettingsStatus from "../../(partials)/settings-status";
import useKnowledgebaseDocuments from "../(hooks)/use-knowledgebase-documents";
import KnowledgebaseDocumentRow from "./knowledgebase-document-row";
import KnowledgebaseTextForm from "./knowledgebase-text-form";

type Props = {
    knowledgebase: PublicKnowledgebase;
    /**
     * A super admin: adds, writes and deletes documents. Admins only read
     * the list.
     */
    can_edit: boolean;
    /**
     * The install's embedding model, to tell a document that needs
     * re-indexing.
     */
    embedding_model: string | null;
    onClose: () => void;
};

/**
 * A knowledgebase's documents: each with how much of it is searchable,
 * files to upload, and text to write straight in. A document is read
 * (chunked and embedded) in the background; the list follows until it's
 * done.
 */
export default function KnowledgebaseDocumentsModal({ knowledgebase, can_edit, embedding_model, onClose }: Props) {
    const { documents, busy, status, upload, saveText, remove } = useKnowledgebaseDocuments({
        knowledgebase_id: knowledgebase.id,
    });
    /**
     * `new` writes a text document, a number edits that one.
     */
    const [writing, setWriting] = useState<"new" | number>();
    const file_input = useRef<HTMLInputElement>(null);

    if (writing) {
        return (
            <AddModalShell
                open
                setOpen={(next) => !next && setWriting(undefined)}
                title={writing == "new" ? `Write a document in ${knowledgebase.name}` : "Edit the document"}
                description="Bots search it once it's read, a few moments after it's saved."
            >
                <KnowledgebaseTextForm
                    document_id={writing == "new" ? undefined : writing}
                    loading={busy}
                    onSave={saveText}
                    onCancel={() => setWriting(undefined)}
                />
                <SettingsStatus status={status?.error ? status : undefined} />
            </AddModalShell>
        );
    }

    return (
        <AddModalShell
            open
            setOpen={(next) => !next && onClose()}
            title={`Documents in ${knowledgebase.name}`}
            description={`Upload ${BotTextFileExtensions.join(", ")} files, or write text straight in. Each is split into passages bots search.`}
        >
            {documents ? (
                <SettingsList is_empty={!documents.length} empty="No documents yet.">
                    {documents.map((document) => (
                        <KnowledgebaseDocumentRow
                            key={document.id}
                            document={document}
                            embedding_model={embedding_model}
                            busy={busy}
                            onEdit={can_edit && document.source == "text" ? () => setWriting(document.id) : undefined}
                            onDelete={can_edit ? () => remove({ document }) : undefined}
                        />
                    ))}
                </SettingsList>
            ) : (
                <Loading />
            )}
            {can_edit ? (
                <Row className="gap-1!">
                    <input
                        ref={file_input}
                        type="file"
                        multiple
                        accept={BotTextFileExtensions.map((ext) => `.${ext}`).join(",")}
                        className="hidden"
                        onChange={(event) => {
                            const files = Array.from(event.target.files || []);
                            upload({ files }).catch(() => {});
                            event.target.value = "";
                        }}
                    />
                    <Button
                        title="Upload files"
                        type="button"
                        variant="ghost"
                        color="gray"
                        size="small"
                        loading={busy}
                        onClick={() => file_input.current?.click()}
                        beforeIcon={<Upload size={14} aria-hidden />}
                        className="gap-1!"
                    >
                        Upload files
                    </Button>
                    <Button
                        title="Write a document"
                        type="button"
                        variant="ghost"
                        color="gray"
                        size="small"
                        disabled={busy}
                        onClick={() => setWriting("new")}
                        beforeIcon={<NotebookPen size={14} aria-hidden />}
                        className="gap-1!"
                    >
                        Write a document
                    </Button>
                </Row>
            ) : null}
            <SettingsStatus status={status} />
        </AddModalShell>
    );
}
