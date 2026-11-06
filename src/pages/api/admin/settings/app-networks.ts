import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import grabAppNetworks from "@/src/functions/backend/db/app-settings/grab-app-networks";
import saveAppSetting from "@/src/functions/backend/db/app-settings/save-app-setting";
import dockerRequest from "@/src/functions/backend/docker/docker-request";
import listJoinableNetworks from "@/src/functions/backend/docker/list-joinable-networks";
import syncAppNetworks, { type SyncedAppNetworks } from "@/src/functions/backend/docker/sync-app-networks";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { AppExtraNetworksSettingKey } from "@/src/dict/app-network-dict";
import { SaveAppNetworksRequestSchema } from "@/src/schemas/app-network-schema";
import type { AppNetworksOverview } from "@/src/types";
import AppError from "@/src/utils/app-error";
import checkAppNetworks from "@/src/utils/check-app-networks";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * Super admin only: the extra docker networks the app's own container
 * joins (never computers). GET syncs and reads where the app stands on
 * each, with every other network on this machine for the picker; POST saves the whole list, refusing a new name with no network
 * behind it, leaves the removed ones and joins the rest at once.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<AppNetworksOverview>> = async ({ req, body }) => {
    try {
        if (req.method != "GET" && req.method != "POST") throw new AppError(`Method not allowed`);

        const user = await grabSuperAdminUser({ req });

        if (!user?.id) throw new AppError(`Only a super admin can change the app's docker networks.`);

        if (req.method == "GET") {
            return { success: true, singleRes: await withAvailable({ overview: await syncAppNetworks() }) };
        }

        const request = parseWithSchema({ schema: SaveAppNetworksRequestSchema, data: body });
        const checked = checkAppNetworks({ networks: request.networks });

        if (checked.error !== undefined) throw new AppError(checked.error);

        const networks = checked.networks;
        const before = await grabAppNetworks();
        const added = networks.filter((name) => !before.includes(name));
        const removed = before.filter((name) => !networks.includes(name));

        for (const name of added) {
            const found = await dockerRequest({ path: `/networks/${encodeURIComponent(name)}` });

            if (found.status == 404) {
                throw new AppError(`There's no "${name}" network on this machine. Create it first (docker network create ${name}).`);
            }

            if (!found.ok) throw new AppError(`Couldn't read the "${name}" network: ${found.message}`);
        }

        await saveAppSetting({
            key: AppExtraNetworksSettingKey,
            value: networks.length ? JSON.stringify(networks) : null,
        });

        const overview = await syncAppNetworks({ leave: removed });

        await logEvent({
            title: "App networks changed",
            category: "system",
            user_id: user.id,
            plain_text: networks.length
                ? `User #${user.id} set the app's extra docker networks to ${networks.join(", ")}.`
                : `User #${user.id} removed the app's extra docker networks.`,
            metadata: { networks, added, removed },
            ip_address: grabRequestIP(req),
        });

        return { success: true, singleRes: await withAvailable({ overview }) };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};

/**
 * Adds the networks the picker offers: every one on this machine the app
 * isn't on for another reason. Listed ones stay in, so one removed before
 * saving can be picked again (the form leaves out what it lists). None
 * when docker can't list them.
 */
async function withAvailable({ overview }: { overview: SyncedAppNetworks }): Promise<AppNetworksOverview> {
    const available_networks = await listJoinableNetworks({ joined: overview.other_networks }).catch(
        () => [] as string[],
    );

    return { ...overview, available_networks };
}
