import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import grabHarnessOverview from "@/src/functions/backend/db/harness/grab-harness-overview";
import saveHarnessProvider from "@/src/functions/backend/db/harness/save-harness-provider";
import syncHarnessProviderModels from "@/src/functions/backend/db/harness/sync-harness-provider-models";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { SaveHarnessProviderRequestSchema } from "@/src/schemas/harness-schema";
import type { HarnessOverviewPayload } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Super admin only: adds or updates a model provider, then fetches its
 * model list. A failed fetch still saves the provider and says why.
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
            throw new AppError(`Only a super admin can change model providers.`);
        }

        const request = parseWithSchema({
            schema: SaveHarnessProviderRequestSchema,
            data: body,
        });

        const provider = await saveHarnessProvider(request);

        await logEvent({
            title: request.provider_id
                ? "Model provider updated"
                : "Model provider added",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} ${request.provider_id ? "updated" : "added"} model provider #${provider.id} (${provider.kind}).`,
            details: [
                { label: "Key changed", value: Boolean(request.api_key || request.clear_key) },
                { label: "Enabled", value: request.enabled },
            ],
            ip_address: grabRequestIP(req),
        });

        let msg = `Saved.`;

        if (provider.enabled) {
            try {
                const count = await syncHarnessProviderModels({ provider });
                msg = `Saved. Found ${count} model${count == 1 ? "" : "s"}.`;
            } catch (error: unknown) {
                msg = `Saved, but its models couldn't be listed: ${error instanceof Error ? error.message : String(error)}`;
            }
        }

        return {
            success: true,
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
