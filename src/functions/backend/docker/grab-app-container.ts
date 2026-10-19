import fs from "fs";
import os from "os";
import dockerRequest from "./docker-request";

export type AppContainer = {
    id: string;
    mounts: { Source: string; Destination: string }[];
    networks: string[];
};

let cached: Promise<AppContainer | null> | undefined;

/**
 * The docker container this app runs in, or null when it runs straight on
 * the host (a dev server). Read once per process: docker sets the
 * container's hostname to its id.
 */
export default function grabAppContainer(): Promise<AppContainer | null> {
    cached ??= inspectSelf();
    return cached;
}

async function inspectSelf(): Promise<AppContainer | null> {
    if (!fs.existsSync("/.dockerenv")) return null;

    const res = await dockerRequest<{
        Id: string;
        Mounts?: AppContainer["mounts"];
        NetworkSettings?: { Networks?: Record<string, unknown> };
    }>({ path: `/containers/${encodeURIComponent(os.hostname())}/json` });

    if (!res.ok || !res.data?.Id) {
        throw new Error(`The app runs in docker but can't find its own container: ${res.message}`);
    }

    return {
        id: res.data.Id,
        mounts: res.data.Mounts || [],
        networks: Object.keys(res.data.NetworkSettings?.Networks || {}),
    };
}
