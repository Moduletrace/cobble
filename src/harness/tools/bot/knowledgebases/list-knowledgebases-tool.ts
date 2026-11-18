import { z } from "zod";
import grabKnowledgebasesOverview from "@/src/functions/backend/db/knowledgebases/grab-knowledgebases-overview";
import listKnowledgebaseDocuments from "@/src/functions/backend/db/knowledgebases/list-knowledgebase-documents";
import AppError from "@/src/utils/app-error";
import type { HarnessTool } from "../../../types";
import describeKnowledgebase from "./describe-knowledgebase";

type Params = {
    user_id: number | string;
};

type Args = {
    knowledgebase_id?: number;
};

/**
 * Every knowledgebase on the install, or one with its documents, read from
 * the app's own rows: a bot reports what it can search from this, never
 * from having added something earlier. Reading changes nothing, so even an
 * unattended run gets it.
 */
export default function listKnowledgebasesTool({ user_id }: Params): HarnessTool<Args> {
    return {
        name: "list_knowledgebases",
        description: `List the install's knowledgebases: who reaches each, how many documents, how much is searchable yet and the install's embedding model. With knowledgebase_id, one of them with its documents and each one's state (passages, failed, not read yet). Read this before adding, changing or deleting anything, and after adding a document to see it read.`,
        schema: z.object({
            knowledgebase_id: z.number().int().positive().optional(),
        }),
        run: async ({ args }) => {
            const overview = await grabKnowledgebasesOverview({ user_id });

            if (!overview.knowledgebases.length) {
                return `There are no knowledgebases yet. save_knowledgebase adds one.`;
            }

            if (args.knowledgebase_id) {
                const knowledgebase = overview.knowledgebases.find((item) => item.id == args.knowledgebase_id);

                if (!knowledgebase) throw new AppError(`That knowledgebase doesn't exist.`);

                const { documents } = await listKnowledgebaseDocuments({ knowledgebase_id: knowledgebase.id });

                return describeKnowledgebase({ knowledgebase, documents });
            }

            return [
                overview.embedding_model
                    ? `The install reads documents with ${overview.embedding_model}.`
                    : `The install has no embedding model, so knowledgebases are searched by words only.`,
                ...overview.knowledgebases.map((knowledgebase) => describeKnowledgebase({ knowledgebase })),
                `Read one with list_knowledgebases and its knowledgebase_id.`,
            ].join("\n");
        },
    };
}