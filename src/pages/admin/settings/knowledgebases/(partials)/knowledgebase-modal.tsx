import { useState } from "react";
import AddFormActions from "@/src/layouts/bots/(partials)/add-form-actions";
import AddModalShell from "@/src/layouts/bots/(partials)/add-modal-shell";
import Checkbox from "@moduletrace/twui/form/Checkbox";
import Form from "@moduletrace/twui/form/Form";
import Input from "@moduletrace/twui/form/Input";
import Textarea from "@moduletrace/twui/form/Textarea";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import type { ExtensionBundleDocument, KnowledgebasesOverviewPayload, PublicKnowledgebase } from "@/src/types";
import type { ExtensionPaste } from "@/src/utils/read-extension-paste";
import PasteExtensionModal from "../../(partials)/paste-extension-modal";

type Props = {
    /**
     * Edits this knowledgebase; adds one when not given.
     */
    knowledgebase?: PublicKnowledgebase;
    onSaved: (overview: KnowledgebasesOverviewPayload, msg: string) => void;
    onCancel: () => void;
};

/**
 * Adds or edits a knowledgebase: its name, the one line that tells a bot
 * what it holds, whether it's on, and whether every bot gets it. Its
 * documents are added from its row.
 */
export default function KnowledgebaseModal({ knowledgebase, onSaved, onCancel }: Props) {
    const [name, setName] = useState(knowledgebase?.name || "");
    const [description, setDescription] = useState(knowledgebase?.description || "");
    const [enabled, setEnabled] = useState(knowledgebase?.enabled ?? true);
    const [all_bots, setAllBots] = useState(knowledgebase?.access.all_bots ?? false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();
    /**
     * The documents a pasted export brings, added when it's saved.
     */
    const [documents, setDocuments] = useState<ExtensionBundleDocument[]>([]);
    /**
     * Remounts the form after a paste: an input reads its value only when
     * it is created.
     */
    const [form_version, setFormVersion] = useState(0);
    /**
     * The JSON paste: its own modal, over this form.
     */
    const [paste_open, setPasteOpen] = useState(false);
    /**
     * What a pasted export brought along, under the form.
     */
    const [notice, setNotice] = useState<string>();

    const id = `knowledgebase-${knowledgebase?.id || "new"}`;

    /**
     * Fills the form from JSON another install exported.
     */
    const fill = ({ paste, notice }: { paste: ExtensionPaste; notice: string }) => {
        if (paste.kind != "knowledgebase") return;

        const config = paste.config;

        setName(config.name);
        setDescription(config.description);
        setEnabled(config.enabled);
        setAllBots(config.all_bots);
        setDocuments(paste.item.documents);
        setError(undefined);
        setNotice(notice);
        setFormVersion((prev) => prev + 1);
    };

    const submit = async () => {
        if (
            loading ||
            !window.confirm(knowledgebase ? `Save ${knowledgebase.name}?` : `Add ${name || "this knowledgebase"}?`)
        ) {
            return;
        }

        setLoading(true);
        setError(undefined);

        const res = await postAdminApi<KnowledgebasesOverviewPayload>({
            path: "knowledgebases/save-knowledgebase",
            body: { knowledgebase_id: knowledgebase?.id, name, description, enabled, all_bots, documents },
        });

        setLoading(false);

        if (!res.success || !res.singleRes) {
            setError(res.msg || "Couldn't save the knowledgebase.");
            return;
        }

        onSaved(res.singleRes, res.msg || "Saved.");
    };

    return (
        <AddModalShell
            open
            setOpen={(next) => !next && onCancel()}
            title={knowledgebase ? `Edit ${knowledgebase.name}` : "Add a knowledgebase"}
            description="Bots search it once it's attached to them. Add its documents from its row, or paste an export that brings them."
        >
            <Form key={form_version} className="w-full gap-4! items-stretch pt-4" onSubmit={submit}>
                <Input
                    id={`${id}-name`}
                    title="Name"
                    label="Name"
                    showLabel
                    placeholder="Product handbook"
                    defaultValue={name}
                    autoComplete="off"
                    info="What the settings page and the composer call it."
                    onChange={(e) => setName(e.target.value)}
                />
                <Textarea
                    id={`${id}-description`}
                    title="What it holds"
                    label="What it holds"
                    showLabel
                    rows={2}
                    placeholder="Pricing, plans and refund rules, as the sales team uses them."
                    defaultValue={description}
                    info="The one line a bot reads to know when to search it. Say what's in it."
                    onChange={(e) => setDescription(e.target.value)}
                />
                <Checkbox title="On" label="On: bots search it" checked={enabled} changeHandler={setEnabled} />
                <Checkbox
                    title="Every bot"
                    label="Every bot by default: every bot now and every new one, the coordinator included. Each can still drop it."
                    checked={all_bots}
                    changeHandler={setAllBots}
                />
                <AddFormActions
                    submit_label={knowledgebase ? "Save" : "Add knowledgebase"}
                    loading={loading}
                    error={error}
                    notice={notice}
                    onCancel={onCancel}
                    action={!knowledgebase ? { label: "Paste JSON", onClick: () => setPasteOpen(true) } : undefined}
                />
            </Form>
            {!knowledgebase && paste_open ? (
                <PasteExtensionModal kind="knowledgebase" onFill={fill} onCancel={() => setPasteOpen(false)} />
            ) : null}
        </AddModalShell>
    );
}
