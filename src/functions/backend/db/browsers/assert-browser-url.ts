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
 * since what a name resolves to can change.
 */
export default async function assertBrowserUrl({ url }: Params) {
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
    const config = network?.ok ? network.data?.IPAM?.Config?.find((c) => c.Subnet) : undefined;

    for (const address of addresses) {
        const problem = checkBrowserAddress({
            address,
            network: config ? { subnet: config.Subnet, gateway: config.Gateway } : null,
            allow_loopback: process.env.NODE_ENV != "production",
        });

        if (problem) throw new AppError(problem);
    }
}
