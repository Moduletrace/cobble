import path from "path";
import grabAppContainer from "./grab-app-container";

type Params = {
    /**
     * A path as this app sees it.
     */
    local_path: string;
};

/**
 * The same path as the docker host sees it, for a bind mount: docker
 * resolves mount sources on the host, not in this app's container. In a
 * container the path must sit under one of its mounts (the deepest one
 * wins); on the host it's returned as it is.
 */
export default async function resolveHostPath({ local_path }: Params) {
    const container = await grabAppContainer();
    const target = path.resolve(local_path);

    if (!container) return target;

    const mount = container.mounts
        .filter(
            (m) => target == m.Destination || target.startsWith(`${m.Destination.replace(/\/+$/, "")}/`),
        )
        .sort((a, b) => b.Destination.length - a.Destination.length)[0];

    if (!mount) {
        throw new Error(
            `${target} isn't on a volume, so computers can't keep their files there. Mount DATA_DIR into the app's container.`,
        );
    }

    return path.join(mount.Source, path.relative(mount.Destination, target));
}
