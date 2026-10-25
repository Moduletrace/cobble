import { AppData } from "@/src/data/app-data";
import grabEnv from "@/src/functions/backend/db/envs/grab-env";
import dockerRequest from "./docker-request";
import grabAppContainer from "./grab-app-container";

/**
 * Where a computer reaches this app (no trailing slash), for the hooks it
 * calls: the `COMPUTER_APP_URL` app setting when set, else the app's
 * container by name on the docker network, else (a dev server on the
 * host) the computers' network gateway, which is the host. Null when
 * none can be worked out.
 */
export default async function grabComputerAppUrl(): Promise<string | null> {
    const setting = (await grabEnv({ key: "COMPUTER_APP_URL" }))?.trim().replace(/\/+$/, "");

    if (setting) return setting;

    const port = process.env.PORT || 7227;
    const container = await grabAppContainer().catch(() => null);

    if (container?.name) return `http://${container.name}:${port}`;

    const network = await dockerRequest<{ IPAM?: { Config?: { Gateway?: string }[] } }>({
        path: `/networks/${encodeURIComponent(AppData.DockerNetworkName)}`,
    }).catch(() => null);
    const gateway = network?.ok ? network.data?.IPAM?.Config?.find((c) => c.Gateway)?.Gateway : undefined;

    return gateway ? `http://${gateway}:${port}` : null;
}
