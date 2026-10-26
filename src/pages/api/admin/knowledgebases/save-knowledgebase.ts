import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import grabKnowledgebasesOverview from "@/src/functions/backend/db/knowledgebases/grab-knowledgebases-overview";
import saveKnowledgebase from "@/src/functions/backend/db/knowledgebases/save-knowledgebase";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { SaveKnowledgebaseRequestSchema } from "@/src/schemas/knowledgebase-schema";
import type { KnowledgebasesOverviewPayload } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Super admin only: adds or edits a knowledgebase.
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

        const data = parseWithSchema({ schema: SaveKnowledgebaseRequestSchema, data: body });
        const knowledgebase_id = await saveKnowledgebase({ user_id: user.id, data });

        await logEvent({
            title: data.knowledgebase_id ? "Knowledgebase changed" : "Knowledgebase added",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} ${data.knowledgebase_id ? "changed" : "added"} the knowledgebase ${data.name} (#${knowledgebase_id}).`,
            metadata: { knowledgebase_id },
            ip_address: grabRequestIP(req),
        });

        return {
            success: true,
            msg: `Saved ${data.name}.`,
            singleRes: await grabKnowledgebasesOverview({ user_id: user.id }),
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
