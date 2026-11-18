import type { HarnessTool } from "../../../types";
import addKnowledgebaseDocumentTool from "./add-knowledgebase-document-tool";
import deleteKnowledgebaseDocumentTool from "./delete-knowledgebase-document-tool";
import deleteKnowledgebaseTool from "./delete-knowledgebase-tool";
import listKnowledgebasesTool from "./list-knowledgebases-tool";
import reindexKnowledgebaseTool from "./reindex-knowledgebase-tool";
import saveKnowledgebaseTool from "./save-knowledgebase-tool";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    workspace_id?: number | string | null;
    /**
     * The computer a task run is on, for a path that doesn't name one.
     */
    computer_id?: number | string | null;
    /**
     * A reply or a task the user follows. An unattended run (a schedule, a
     * hook call, a hidden session) reads knowledgebases but never changes
     * them: what starts it comes from outside.
     */
    attended: boolean;
};

/**
 * The coordinator's knowledgebase tools: list, fill, re-index, delete and
 * share out. Every one but the listing is only in an attended run, and each
 * checks the super admin itself.
 */
export default function grabCoordinatorKnowledgebaseTools({
    user_id,
    bot_id,
    workspace_id,
    computer_id,
    attended,
}: Params): HarnessTool<unknown>[] {
    const tools: HarnessTool<unknown>[] = [listKnowledgebasesTool({ user_id }) as HarnessTool<unknown>];

    if (!attended) return tools;

    return [
        ...tools,
        saveKnowledgebaseTool({ user_id }) as HarnessTool<unknown>,
        addKnowledgebaseDocumentTool({ user_id, bot_id, workspace_id, computer_id, attended }) as HarnessTool<unknown>,
        deleteKnowledgebaseDocumentTool({ user_id, attended }) as HarnessTool<unknown>,
        deleteKnowledgebaseTool({ user_id, attended }) as HarnessTool<unknown>,
        reindexKnowledgebaseTool({ user_id, attended }) as HarnessTool<unknown>,
    ];
}