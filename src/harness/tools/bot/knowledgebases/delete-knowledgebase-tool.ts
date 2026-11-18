import { z } from "zod";
import deleteKnowledgebase from "@/src/functions/backend/db/knowledgebases/delete-knowledgebase";
import grabKnowledgebase from "@/src/functions/backend/db/knowledgebases/grab-knowledgebase";
import listKnowledgebaseDocuments from "@/src/functions/backend/db/knowledgebases/list-knowledgebase-documents";
import logEvent from "@/src/functions/backend/logger";
import type { HarnessTool } from "../../../types";
import assertSuperAdminRun from "../extensions/assert-super-admin-run";

type Params = {
    user_id: number | string;
    attended: boolean;
};

type Args = {
    knowledgebase_id: number;
};

/**
 * Deletes a knowledgebase with every document in it and every bot's and
 * workspace's link to it. Only on the super admin's own request: nothing
 * brings it back.
 */
export default function deleteKnowledgebaseTool({ user_id, attended }: Params): HarnessTool<Args> {
    return {
        name: "delete_knowledgebase",
        description: `Delete a knowledgebase, every document in it and who it was shared with, for good. Only when the super admin asks for that knowledgebase by name; to take one bot or document away, change the access or delete the document instead.`,
        schema: z.object({
            knowledgebase_id: z.number().int().positive(),
        }),
        run: async ({ args }) => {
            await assertSuperAdminRun({ user_id });

            if (!attended) throw new Error(`Knowledgebases are only changed in a reply or a task the user follows.`);

            const knowledgebase = await grabKnowledgebase({ knowledgebase_id: args.knowledgebase_id });
            const { documents } = await listKnowledgebaseDocuments({ knowledgebase_id: knowledgebase.id });

            await deleteKnowledgebase({ knowledgebase_id: knowledgebase.id });

            await logEvent({
                title: "Knowledgebase deleted",
                category: "system",
                user_id: Number(user_id),
                plain_text: `Deleted knowledgebase #${knowledgebase.id} (${knowledgebase.name}) with ${documents.length} documents.`,
                metadata: { knowledgebase_id: knowledgebase.id },
            });

            return `Deleted knowledgebase #${knowledgebase.id} ${knowledgebase.name} with ${documents.length} documents. It's gone from every bot and workspace.`;
        },
    };
}