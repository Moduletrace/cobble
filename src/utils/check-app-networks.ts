import { AppData } from "@/src/data/app-data";
import { AppNetworkNameRegex, AppNetworkReservedNames } from "@/src/dict/app-network-dict";

type Params = {
    networks: string[];
};

type Result = { networks: string[]; error?: undefined } | { networks?: undefined; error: string };

/**
 * The extra networks the app's container should join, trimmed and without
 * repeats, or why the list can't be saved: a name docker wouldn't take,
 * `host`/`none`, the computers' own network (`AppData.DockerNetworkName`,
 * always joined) or more than `AppData.AppExtraNetworksMax`.
 */
export default function checkAppNetworks({ networks }: Params): Result {
    const names: string[] = [];

    for (const raw of networks) {
        const name = raw.trim();

        if (!name || names.includes(name)) continue;

        if (!AppNetworkNameRegex.test(name)) {
            return { error: `"${name}" isn't a docker network name: letters, numbers, dot, dash and underscore only.` };
        }

        if ((AppNetworkReservedNames as readonly string[]).includes(name)) {
            return { error: `The app can't join the "${name}" network.` };
        }

        if (name == AppData.DockerNetworkName) {
            return { error: `The app is always on the "${name}" network: it's the one computers run on.` };
        }

        names.push(name);
    }

    if (names.length > AppData.AppExtraNetworksMax) {
        return { error: `The app can join at most ${AppData.AppExtraNetworksMax} extra networks.` };
    }

    return { networks: names };
}
