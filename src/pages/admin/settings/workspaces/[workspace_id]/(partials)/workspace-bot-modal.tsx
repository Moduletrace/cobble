import { useState } from "react";
import Form from "@moduletrace/twui/form/Form";
import CodeEditor from "@/src/components/general/code-editor";
import type { WorkspaceBot } from "@/src/types";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import AddFormActions from "@/src/layouts/bots/(partials)/add-form-actions";
import AddModalShell from "@/src/layouts/bots/(partials)/add-modal-shell";

type Props = {
    workspace_id: number;
    workspace_name: string;
    bot: WorkspaceBot;
    onClose: () => void;
    onSaved: (bots: WorkspaceBot[]) => void;
};

/**
 * What one bot has for this workspace alone: instructions on top of its
 * own, and its memory here. The bot rewrites both as it learns; the
 * coordinator can set the instructions too.
 */
export default function WorkspaceBotModal({ workspace_id, workspace_name, bot, onClose, onSaved }: Props) {
    const [system_prompt, setSystemPrompt] = useState(bot.workspace_system_prompt || "");
    const [memory, setMemory] = useState(bot.workspace_memory || "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();
    const name = bot.name || "This bot";

    const submit = async () => {
        if (loading) return;
        if (!window.confirm(`Save ${bot.name || "this bot"}'s instructions and memory here?`)) return;

        setLoading(true);
        setError(undefined);

        const res = await postAdminApi<WorkspaceBot>({
            path: "workspaces/update-bot",
            body: { workspace_id, bot_id: bot.id, system_prompt, memory },
        });

        setLoading(false);

        if (!res.success) {
            setError(res.msg || "Couldn't save.");
            return;
        }

        onSaved(res.payload || []);
        onClose();
    };

    return (
        <AddModalShell
            open
            setOpen={(open) => !open && onClose()}
            title={`${name} in ${workspace_name}`}
            description={`${name} keeps its own instructions and memory everywhere. These apply only here, and it updates them itself as it learns how this workspace works.`}
        >
            <Form className="w-full gap-4! items-stretch pt-4" onSubmit={submit}>
                <CodeEditor
                    mode="markdown"
                    className="h-44"
                    title="Instructions here"
                    content={system_prompt}
                    placeholder="In this workspace, write for the marketing team: short, plain, no jargon."
                    onChange={(value) => setSystemPrompt(value)}
                />
                <CodeEditor
                    mode="markdown"
                    className="h-32"
                    title="Memory here"
                    content={memory}
                    info="What it must remember in this workspace."
                    onChange={(value) => setMemory(value)}
                />
                <AddFormActions submit_label="Save" loading={loading} error={error} onCancel={onClose} />
            </Form>
        </AddModalShell>
    );
}
