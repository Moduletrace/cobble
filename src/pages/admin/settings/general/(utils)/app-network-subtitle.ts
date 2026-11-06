import type { AppNetworksOverview } from "@/src/types";

type Params = {
    network?: AppNetworksOverview["networks"][number];
};

/**
 * One line on where the app stands on a network in its list. A name
 * without a status is one added but not saved yet.
 */
export default function appNetworkSubtitle({ network }: Params) {
    if (!network) return "Joins when you save.";

    switch (network.status) {
        case "connected":
            return "Joined.";
        case "missing":
            return network.message || "There's no such network on this machine. The app joins it once it exists.";
        case "idle":
            return network.message || "Kept for when the app runs in docker.";
        default:
            return `Couldn't join: ${network.message || "docker refused."} Tried again every five minutes.`;
    }
}
