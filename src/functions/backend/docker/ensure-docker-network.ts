import { AppData } from "@/src/data/app-data";
import dockerRequest from "./docker-request";
import grabAppContainer from "./grab-app-container";

/**
 * Docker can still be coming up when the app container starts (a host
 * reboot, especially), so a transient failure is retried before the app
 * gives up on networking.
 */
const Attempts = 3;
const RetryMs = 2000;

/**
 * Makes sure the network computers run on (`AppData.DockerNetworkName`)
 * exists and, when the app runs in docker, that its container is on it,
 * so it reaches computers by name.
 */
export default async function ensureDockerNetwork() {
    let last_error: unknown;

    for (let attempt = 1; attempt <= Attempts; attempt++) {
        try {
            return await connectNetwork();
        } catch (error: unknown) {
            last_error = error;

            if (attempt < Attempts) {
                await new Promise((resolve) => setTimeout(resolve, RetryMs));
            }
        }
    }

    throw last_error;
}

async function connectNetwork() {
    const name = AppData.DockerNetworkName;
    const existing = await dockerRequest({ path: `/networks/${encodeURIComponent(name)}` });

    if (existing.status == 404) {
        const created = await dockerRequest({
            method: "POST",
            path: `/networks/create`,
            body: { Name: name, Driver: "bridge", CheckDuplicate: true },
        });

        if (!created.ok && created.status != 409) {
            throw new Error(`Couldn't create the ${name} network: ${created.message}`);
        }
    } else if (!existing.ok) {
        throw new Error(`Couldn't read the ${name} network: ${existing.message}`);
    }

    const container = await grabAppContainer();

    if (!container || container.networks.includes(name)) return name;

    const connected = await dockerRequest({
        method: "POST",
        path: `/networks/${encodeURIComponent(name)}/connect`,
        body: { Container: container.id },
    });

    if (!connected.ok && connected.status != 403) {
        throw new Error(`Couldn't connect the app to the ${name} network: ${connected.message}`);
    }

    container.networks.push(name);

    return name;
}
