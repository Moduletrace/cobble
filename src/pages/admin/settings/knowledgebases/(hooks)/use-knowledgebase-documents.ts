import { useEffect, useState } from "react";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import type { KnowledgebaseDocument, KnowledgebaseDocumentsPayload } from "@/src/types";
import readFileDataUrl from "../(functions)/read-file-data-url";

type Params = {
    knowledgebase_id: number;
};

type Status = { error?: boolean; success?: boolean; msg?: string };

/**
 * How often the list is read again while a document is still being read.
 */
const PollMs = 4000;

/**
 * A knowledgebase's documents, loaded when they're opened and read again
 * every few seconds while one is still waiting to be read, with uploading,
 * writing and deleting them (each asks first).
 */
export default function useKnowledgebaseDocuments({ knowledgebase_id }: Params) {
    const [documents, setDocuments] = useState<KnowledgebaseDocument[]>();
    const [busy, setBusy] = useState(false);
    const [status, setStatus] = useState<Status>();

    const load = async () => {
        const res = await postAdminApi<KnowledgebaseDocumentsPayload>({
            path: "knowledgebases/documents",
            body: { knowledgebase_id },
        });

        if (res.success && res.singleRes) setDocuments(res.singleRes.documents);
        else setStatus({ error: true, msg: res.msg || "Couldn't load the documents." });
    };

    useEffect(() => {
        load();
    }, [knowledgebase_id]);

    const waiting = Boolean(documents?.some((document) => document.indexing));

    useEffect(() => {
        if (!waiting) return;

        const timer = setInterval(load, PollMs);

        return () => clearInterval(timer);
    }, [waiting, knowledgebase_id]);

    const post = async ({ path, body }: { path: string; body: Record<string, unknown> }) => {
        setBusy(true);
        setStatus(undefined);

        const res = await postAdminApi<KnowledgebaseDocumentsPayload>({ path, body });

        setBusy(false);

        if (!res.success || !res.singleRes) {
            setStatus({ error: true, msg: res.msg || "That didn't work." });
            return false;
        }

        setDocuments(res.singleRes.documents);
        setStatus({ success: true, msg: res.msg || "Saved." });
        return true;
    };

    const upload = async ({ files }: { files: File[] }) => {
        if (!files.length || busy) return;

        const names = files.map((file) => file.name).join(", ");

        if (!window.confirm(`Add ${names} to this knowledgebase?`)) return;

        for (const file of files) {
            const data_url = await readFileDataUrl({ file });

            if (!data_url) {
                setStatus({ error: true, msg: `${file.name} couldn't be read.` });
                return;
            }

            const done = await post({
                path: "knowledgebases/upload-document",
                body: { knowledgebase_id, name: file.name, data_url },
            });

            if (!done) return;
        }
    };

    const saveText = async ({ document_id, name, content }: { document_id?: number; name: string; content: string }) => {
        if (busy || !window.confirm(document_id ? `Save ${name || "this document"}?` : `Add ${name || "this document"}?`)) {
            return false;
        }

        return await post({
            path: "knowledgebases/save-text-document",
            body: { knowledgebase_id, document_id, name, content },
        });
    };

    const remove = async ({ document }: { document: KnowledgebaseDocument }) => {
        if (busy || !window.confirm(`Delete ${document.name}? Bots stop finding it at once.`)) return;

        await post({ path: "knowledgebases/delete-document", body: { document_id: document.id } });
    };

    return { documents, busy, status, upload, saveText, remove };
}
