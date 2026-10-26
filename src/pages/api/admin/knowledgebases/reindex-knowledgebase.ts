import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import grabKnowledgebasesOverview from "@/src/functions/backend/db/knowledgebases/grab-knowledgebases-overview";
import reindexKnowledgebase from "@/src/functions/backend/db/knowledgebases/reindex-knowledgebase";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { KnowledgebaseIdRequestSchema } from "@/src/schemas/knowledgebase-schema";
import type { KnowledgebasesOverviewPayload } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Super admin only: reads every document of a knowledgebase again, with the
 * install's embedding model as it is now.
 */
export const handler: BunextAPIRouteHandler<
    APIResponseObject<KnowledgebasesOverviewPayload>
> = async ({ req, body }) => {
    try {
        if (req.method != "POST") {
            throw new AppError(`Method not allowed`);
        }

        const user = await grabSuperAdminUser({ req });

        if (!user?.id) {
            throw new AppError(`Only a super admin can do that.`);
        }

        const { knowledgebase_id } = parseWithSchema({ schema: KnowledgebaseIdRequestSchema, data: body });
        const queued = await reindexKnowledgebase({ knowledgebase_id });

        await logEvent({
            title: "Knowledgebase re-indexed",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} re-indexed the knowledgebase #${knowledgebase_id} (${queued} documents).`,
            metadata: { knowledgebase_id, queued },
            ip_address: grabRequestIP(req),
        });

        return {
            success: true,
            msg: queued ? `Reading ${queued} ${queued == 1 ? "document" : "documents"} again.` : "It has no documents yet.",
            singleRes: await grabKnowledgebasesOverview({ user_id: user.id }),
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
