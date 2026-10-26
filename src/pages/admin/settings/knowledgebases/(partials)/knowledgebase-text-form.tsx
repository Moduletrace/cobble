import { useEffect, useState } from "react";
import Form from "@moduletrace/twui/form/Form";
import Input from "@moduletrace/twui/form/Input";
import Loading from "@moduletrace/twui/elements/Loading";
import CodeEditor from "@/src/components/general/code-editor";
import { AppData } from "@/src/data/app-data";
import AddFormActions from "@/src/layouts/bots/(partials)/add-form-actions";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";

type Props = {
    /**
     * Edits this text document (its content loads first); writes a new one
     * when not given.
     */
    document_id?: number;
    loading?: boolean;
    onSave: (params: { document_id?: number; name: string; content: string }) => Promise<boolean>;
    onCancel: () => void;
};

/**
 * Writes a document straight into a knowledgebase, in markdown: a title
 * and the text bots search.
 */
export default function KnowledgebaseTextForm({ document_id, loading, onSave, onCancel }: Props) {
    const [name, setName] = useState("");
    const [content, setContent] = useState("");
    const [ready, setReady] = useState(!document_id);
    const [error, setError] = useState<string>();

    useEffect(() => {
        if (!document_id) return;

        postAdminApi<{ document_id: number; name: string; content: string }>({
            path: "knowledgebases/document-text",
            body: { document_id },
        }).then((res) => {
            if (res.success && res.singleRes) {
                setName(res.singleRes.name);
                setContent(res.singleRes.content);
                setReady(true);
            } else {
                setError(res.msg || "Couldn't open the document.");
            }
        });
    }, [document_id]);

    if (!ready) {
        return error ? <AddFormActions submit_label="Save" error={error} onCancel={onCancel} /> : <Loading />;
    }

    return (
        <Form
            className="w-full gap-4! items-stretch"
            onSubmit={async () => {
                if (await onSave({ document_id, name, content })) onCancel();
            }}
        >
            <Input
                id={`knowledgebase-text-${document_id || "new"}-name`}
                title="Title"
                label="Title"
                showLabel
                placeholder="Refund rules"
                defaultValue={name}
                autoComplete="off"
                info="What bots see as the document's name when they find a passage in it."
                onChange={(e) => setName(e.target.value)}
            />
            <CodeEditor
                mode="markdown"
                className="h-80"
                title="Text"
                content={content}
                info={`Markdown, up to ${AppData.KnowledgebaseTextMaxChars} characters. Headings help: a passage carries the heading above it.`}
                onChange={(value) => setContent(value)}
            />
            <AddFormActions submit_label={document_id ? "Save" : "Add document"} loading={loading} onCancel={onCancel} />
        </Form>
    );
}
