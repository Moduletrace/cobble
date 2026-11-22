import { useState } from "react";
import Form from "@moduletrace/twui/form/Form";
import Stack from "@moduletrace/twui/layout/Stack";
import CodeEditor from "@/src/components/general/code-editor";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import AddFormActions from "@/src/layouts/bots/(partials)/add-form-actions";

type Props = {
    bot_id: number;
    bot_name: string;
    /**
     * Its core memory, from the panel's read.
     */
    memory: string;
    /**
     * Where the conversation is, so its memory there is edited beside it.
     */
    workspace_id?: number | null;
    workspace_name?: string | null;
    workspace_memory?: string;
    onCancel?: () => void;
};

/**
 * The bot panel's memory tab: what it keeps in mind everywhere, and (in a
 * workspace) what it keeps in mind there. Both are markdown, replaced whole;
 * the bot's memory of each person stays its own.
 */
export default function BotMemoryForm({
    bot_id,
    bot_name,
    memory,
    workspace_id,
    workspace_name,
    workspace_memory = "",
    onCancel,
}: Props) {
    const [core, setCore] = useState(memory);
    const [here, setHere] = useState(workspace_memory);
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string>();

    const submit = async () => {
        if (loading) return;
        if (!window.confirm(`Save ${bot_name}'s memory?`)) return;

        setLoading(true);
        setError(undefined);
        setSaved(false);

        try {
            const coreRes = await postAdminApi({
                path: "bots/update-bot-memory",
                body: { bot_id, memory: core },
            });

            if (!coreRes.success) {
                setError(coreRes.msg || "Couldn't save its memory.");
                return;
            }

            if (workspace_id) {
                const hereRes = await postAdminApi({
                    path: "workspaces/update-bot",
                    body: { workspace_id, bot_id, memory: here },
                });

                if (!hereRes.success) {
                    setError(
                        `Saved its memory everywhere, but not in ${workspace_name || "this workspace"}: ${hereRes.msg || "the save failed"}`,
                    );
                    return;
                }
            }

            setSaved(true);
        } catch {
            setError("Couldn't save its memory.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form onSubmit={submit} className="w-full gap-4! items-stretch">
            <CodeEditor
                title="Memory"
                content={memory}
                mode="markdown"
                placeholder="What it should keep in mind wherever it works..."
                info={`What ${bot_name} keeps in mind everywhere it works, for everyone. Markdown, replaced whole.`}
                className="h-52"
                onChange={(value) => {
                    setCore(value);
                    setSaved(false);
                }}
            />

            {workspace_id ? (
                <CodeEditor
                    title={`Memory in ${workspace_name || "this workspace"}`}
                    content={workspace_memory}
                    mode="markdown"
                    placeholder="What it should keep in mind here..."
                    info={`What ${bot_name} keeps in mind while it works here, for everyone in this workspace.`}
                    className="h-40"
                    onChange={(value) => {
                        setHere(value);
                        setSaved(false);
                    }}
                />
            ) : null}

            <AddFormActions
                submit_label="Save"
                loading={loading}
                error={error}
                notice={saved ? "Saved." : undefined}
                onCancel={onCancel}
            />
        </Form>
    );
}