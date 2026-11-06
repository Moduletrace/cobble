import checkAppNetworks from "@/src/utils/check-app-networks";
import dockerRequest from "./docker-request";

type Params = {
    /**
     * Networks the app's container is on for another reason (the
     * computers' network, the installer's), left out of the list.
     */
    joined?: string[];
};

/**
 * Every docker network on this machine the app's container could join
 * (Settings > General's picker), sorted by name: not `host`/`none`, not
 * the computers' network, not one in `joined`.
 */
export default async function listJoinableNetworks({ joined = [] }: Params = {}) {
    const res = await dockerRequest<{ Name?: string }[]>({ path: `/networks` });

    if (!res.ok) throw new Error(`Couldn't list docker's networks: ${res.message}`);

    return (res.data || [])
        .map((network) => network.Name || "")
        .filter((name) => !joined.includes(name) && checkAppNetworks({ networks: [name] }).networks?.length)
        .sort((a, b) => a.localeCompare(b));
}
