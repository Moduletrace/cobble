import { useState } from "react";
import Form from "@moduletrace/twui/form/Form";
import CodeEditor from "@/src/components/general/code-editor";
import type { WorkspaceBot } from "@/src/types";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import AddFormActions from "@/src/layouts/bots/(partials)/add-form-actions";

type Props = {
    workspace_id: number;
    bot_id: number;
    bot_name?: string | null;
    /**
     * What the bot has for this workspace now.
     */
    system_prompt?: string | null;
    memory?: string | null;
    onCancel: () => void;
    /**
     * After the save, with the workspace's crew as it is now.
     */
    onSaved: (bots: WorkspaceBot[]) => void;
};

/**
 * The form for what one bot has for a workspace alone: its instructions
 * there, on top of its own, and its memory there
 * (`api/admin/workspaces/update-bot`, crew managers). It asks first.
 */
export default function WorkspaceBotForm({
    workspace_id,
    bot_id,
    bot_name,
    system_prompt: initial_prompt,
    memory: initial_memory,
    onCancel,
    onSaved,
}: Props) {
    const [system_prompt, setSystemPrompt] = useState(initial_prompt || "");
    const [memory, setMemory] = useState(initial_memory || "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();

    const submit = async () => {
        if (loading) return;
        if (!window.confirm(`Save ${bot_name || "this bot"}'s instructions and memory here?`)) return;

        setLoading(true);
        setError(undefined);

        const res = await postAdminApi<WorkspaceBot>({
            path: "workspaces/update-bot",
            body: { workspace_id, bot_id, system_prompt, memory },
        });

        setLoading(false);

        if (!res.success) {
            setError(res.msg || "Couldn't save.");
            return;
        }

        onSaved(res.payload || []);
    };

    return (
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
            <AddFormActions submit_label="Save" loading={loading} error={error} onCancel={onCancel} />
        </Form>
    );
}
