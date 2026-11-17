import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { AppData } from "@/src/data/app-data";
import dockerRequest from "@/src/functions/backend/docker/docker-request";
import AppError from "@/src/utils/app-error";
import checkBrowserAddress from "@/src/utils/check-browser-address";

type Params = {
    url: string;
};

/**
 * Refuses a browser URL that would reach something inside the install
 * (`checkBrowserAddress`). Runs on save, on test and on every connection,
 * since what a name resolves to can change. Returns the addresses that
 * passed the check, so the connection can be pinned to them rather than
 * resolving the name again (which a rebinding name would answer differently).
 */
export default async function assertBrowserUrl({ url }: Params): Promise<string[]> {
    const parsed = (() => {
        try {
            return new URL(url);
        } catch {
            throw new AppError(`Enter the browser server's http(s) URL.`);
        }
    })();

    if (!/^https?:$/.test(parsed.protocol)) throw new AppError(`Enter the browser server's http(s) URL.`);

    const host = parsed.hostname.replace(/^\[|\]$/g, "");
    const addresses = isIP(host)
        ? [host]
        : (await lookup(host, { all: true }).catch(() => [])).map((found) => found.address);

    if (!addresses.length) throw new AppError(`Couldn't find ${host}.`);

    const network = await dockerRequest<{ IPAM?: { Config?: { Subnet?: string; Gateway?: string }[] } }>({
        path: `/networks/${encodeURIComponent(AppData.DockerNetworkName)}`,
    }).catch(() => null);

    // Fail closed: without the network's own subnets we can't tell a
    // computer's address from a browser's, so a docker read we couldn't
    // make refuses the URL rather than waving every address through.
    if (!network?.ok) throw new AppError(`Couldn't check that address against the computers' network. Try again.`);

    const networks = (network.data?.IPAM?.Config ?? [])
        .filter((config) => config.Subnet)
        .map((config) => ({ subnet: config.Subnet, gateway: config.Gateway }));

    for (const address of addresses) {
        const problem = checkBrowserAddress({
            address,
            networks,
            allow_loopback: process.env.NODE_ENV != "production",
        });

        if (problem) throw new AppError(problem);
    }

    return addresses;
}
