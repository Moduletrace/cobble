import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import grabHarnessOverview from "@/src/functions/backend/db/harness/grab-harness-overview";
import grabHarnessProviders from "@/src/functions/backend/db/harness/grab-harness-providers";
import syncHarnessProviderModels from "@/src/functions/backend/db/harness/sync-harness-provider-models";
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
 * Super admin only: fetches one provider's model list now, instead of
 * waiting for the hourly sync.
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
            throw new AppError(`Only a super admin can sync model providers.`);
        }

        const { provider_id } = parseWithSchema({
            schema: HarnessProviderIdRequestSchema,
            data: body,
        });

        const provider = (await grabHarnessProviders({ provider_id }))[0];

        if (!provider) {
            throw new AppError(`Provider not found.`);
        }

        let success = true;
        let msg: string;

        try {
            const count = await syncHarnessProviderModels({ provider });
            msg = `Found ${count} model${count == 1 ? "" : "s"}.`;
        } catch (error: unknown) {
            success = false;
            msg = `Couldn't list its models: ${error instanceof Error ? error.message : String(error)}`;
        }

        return {
            success,
            msg,
            singleRes: await grabHarnessOverview(),
        };
    } catch (error: unknown) {
        return {
            success: false,
            msg: safeErrorMessage({ error }),
        };
    }
};
