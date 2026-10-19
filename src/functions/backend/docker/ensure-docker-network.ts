import { AppData } from "@/src/data/app-data";
import dockerRequest from "./docker-request";
import grabAppContainer from "./grab-app-container";

/**
 * Makes sure the network computers run on (`AppData.DockerNetworkName`)
 * exists and, when the app runs in docker, that its container is on it,
 * so it reaches computers by name.
 */
export default async function ensureDockerNetwork() {
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
