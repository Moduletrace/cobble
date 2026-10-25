import type { WorkspaceBot } from "@/src/types";
import AddModalShell from "@/src/layouts/bots/(partials)/add-modal-shell";
import WorkspaceBotForm from "./workspace-bot-form";

type Props = {
    workspace_id: number;
    workspace_name?: string | null;
    bot_id: number;
    bot_name?: string | null;
    /**
     * What the bot has for this workspace now.
     */
    system_prompt?: string | null;
    memory?: string | null;
    onClose: () => void;
    onSaved: (bots: WorkspaceBot[]) => void;
};

/**
 * What one bot has for this workspace alone: instructions on top of its
 * own, and its memory here. The bot rewrites both as it learns; the
 * coordinator can set the instructions too. Opened from the workspace's
 * settings and from the bot's.
 */
export default function WorkspaceBotModal({
    workspace_id,
    workspace_name,
    bot_id,
    bot_name,
    system_prompt,
    memory,
    onClose,
    onSaved,
}: Props) {
    const name = bot_name || "This bot";

    return (
        <AddModalShell
            open
            setOpen={(open) => !open && onClose()}
            title={`${name} in ${workspace_name || "this workspace"}`}
            description={`${name} keeps its own instructions and memory everywhere. These apply only here, and it updates them itself as it learns how this workspace works.`}
        >
            <WorkspaceBotForm
                workspace_id={workspace_id}
                bot_id={bot_id}
                bot_name={bot_name}
                system_prompt={system_prompt}
                memory={memory}
                onCancel={onClose}
                onSaved={(bots) => {
                    onSaved(bots);
                    onClose();
                }}
            />
        </AddModalShell>
    );
}
