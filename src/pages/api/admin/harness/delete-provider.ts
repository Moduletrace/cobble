import grabInstallEmbeddingModel from "@/src/functions/backend/db/knowledgebases/grab-install-embedding-model";
import reindexAfterEmbeddingChange from "@/src/functions/backend/db/knowledgebases/reindex-after-embedding-change";
import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import deleteHarnessProvider from "@/src/functions/backend/db/harness/delete-harness-provider";
import grabHarnessOverview from "@/src/functions/backend/db/harness/grab-harness-overview";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { HarnessProviderIdRequestSchema } from "@/src/schemas/harness-schema";
import type { HarnessOverviewPayload } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Super admin only: removes a model provider and its models. Harnesses set
 * to one of them go back to automatic.
 */
export const handler: BunextAPIRouteHandler<
    APIResponseObject<HarnessOverviewPayload>
> = async ({ req, body }) => {
    try {
        if (req.method != "POST") {
            throw new AppError(`Method not allowed`);
        }

        const user = await grabSuperAdminUser({ req });

        if (!user?.id) {
            throw new AppError(`Only a super admin can remove model providers.`);
        }

        const { provider_id } = parseWithSchema({
            schema: HarnessProviderIdRequestSchema,
            data: body,
        });

        const embedding_before = await grabInstallEmbeddingModel();

        await deleteHarnessProvider({ provider_id });
        await reindexAfterEmbeddingChange({ before: embedding_before });

        await logEvent({
            title: "Model provider removed",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} removed model provider #${provider_id}.`,
            ip_address: grabRequestIP(req),
        });

        return {
            success: true,
            msg: `Provider removed.`,
            singleRes: await grabHarnessOverview(),
        };
    } catch (error: unknown) {
        return {
            success: false,
            msg: safeErrorMessage({ error }),
        };
    }
};
