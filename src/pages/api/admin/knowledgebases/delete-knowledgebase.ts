import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import deleteKnowledgebase from "@/src/functions/backend/db/knowledgebases/delete-knowledgebase";
import grabKnowledgebasesOverview from "@/src/functions/backend/db/knowledgebases/grab-knowledgebases-overview";
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
 * Super admin only: deletes a knowledgebase and every document in it.
 * Bots lose it at once.
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
        const knowledgebase = await deleteKnowledgebase({ knowledgebase_id });

        await logEvent({
            title: "Knowledgebase deleted",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} deleted the knowledgebase ${knowledgebase.name} (#${knowledgebase.id}).`,
            metadata: { knowledgebase_id },
            ip_address: grabRequestIP(req),
        });

        return {
            success: true,
            msg: `Deleted ${knowledgebase.name}.`,
            singleRes: await grabKnowledgebasesOverview({ user_id: user.id }),
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
