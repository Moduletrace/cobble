import { AppData } from "@/src/data/app-data";
import grabAppNetworks from "@/src/functions/backend/db/app-settings/grab-app-networks";
import { logError } from "@/src/functions/backend/logger";
import type { AppNetworksOverview } from "@/src/types";
import dockerRequest from "./docker-request";
import grabAppContainer from "./grab-app-container";
import inspectAppContainerNetworks from "./inspect-app-container-networks";

/**
 * The overview without the picker's list, which only the settings page
 * needs (`listJoinableNetworks`).
 */
export type SyncedAppNetworks = Omit<AppNetworksOverview, "available_networks">;

type Params = {
    /**
     * Networks just taken off the list, which the app leaves.
     */
    leave?: string[];
};

/**
 * Networks already logged as missing or refused, so the five-minute sync
 * says so once per process, not every run.
 */
const reported = new Set<string>();

/**
 * Puts the app's own container on every network in `app_extra_networks`
 * it isn't on yet (and off the ones in `leave`). Runs at boot, every five
 * minutes and on save, so the list outlasts the container being recreated
 * on an update and a network being made again. A network that doesn't
 * exist, or that docker refuses, is logged and skipped. Never throws;
 * computers never join these networks.
 */
export default async function syncAppNetworks({ leave = [] }: Params = {}): Promise<SyncedAppNetworks> {
    const saved = await grabAppNetworks().catch(() => [] as string[]);
    const overview: SyncedAppNetworks = {
        in_docker: false,
        networks: [],
        other_networks: [],
        max: AppData.AppExtraNetworksMax,
    };

    const container = await grabAppContainer().catch(() => null);

    if (!container) {
        overview.networks = saved.map((name) => ({
            name,
            status: "idle",
            message: `The app isn't running in docker, so there's no container to connect.`,
        }));
        return overview;
    }

    overview.in_docker = true;

    let current: string[];

    try {
        current = await inspectAppContainerNetworks({ container_id: container.id });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        overview.networks = saved.map((name) => ({ name, status: "failed", message }));
        return overview;
    }

    for (const name of leave) {
        if (saved.includes(name) || name == AppData.DockerNetworkName || !current.includes(name)) continue;

        const left = await dockerRequest({
            method: "POST",
            path: `/networks/${encodeURIComponent(name)}/disconnect`,
            body: { Container: container.id },
        }).catch((error) => ({ ok: false, message: String(error) }));

        if (left.ok) {
            current = current.filter((network) => network != name);
        } else {
            await logError({
                title: "Couldn't leave a docker network",
                category: "system",
                error: new Error(`${name}: ${left.message}`),
                metadata: { network: name },
            }).catch(() => {});
        }
    }

    for (const name of saved) {
        if (current.includes(name)) {
            reported.delete(name);
            overview.networks.push({ name, status: "connected" });
            continue;
        }

        const joined = await dockerRequest({
            method: "POST",
            path: `/networks/${encodeURIComponent(name)}/connect`,
            body: { Container: container.id },
        }).catch((error) => ({ ok: false, status: 0, message: String(error) }));

        if (joined.ok || /already exists/i.test(joined.message || "")) {
            reported.delete(name);
            current.push(name);
            overview.networks.push({ name, status: "connected" });
            continue;
        }

        const missing = joined.status == 404;
        const message = missing ? `There's no "${name}" network on this machine.` : joined.message || `Docker refused.`;

        overview.networks.push({ name, status: missing ? "missing" : "failed", message });

        if (!reported.has(name)) {
            reported.add(name);
            await logError({
                title: "Couldn't join a docker network",
                category: "system",
                error: new Error(`${name}: ${message}`),
                metadata: { network: name },
            }).catch(() => {});
        }
    }

    overview.other_networks = current.filter((name) => !saved.includes(name));

    return overview;
}
