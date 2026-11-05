import dockerRequest from "./docker-request";

type Params = {
    /**
     * e.g. `ghcr.io/moduletrace/cobble-computer:1.0.0`.
     */
    image: string;
    /**
     * Pull even when docker has it, for a newer build under the same tag;
     * the image docker has is kept when the pull fails.
     */
    force?: boolean;
};

/**
 * Pulls an image unless docker already has it (or `force`). Waits for the
 * whole pull, which can take minutes for a large image.
 */
export default async function pullDockerImage({ image, force }: Params) {
    const present = await dockerRequest({ path: `/images/${encodeURIComponent(image)}/json` });

    if (present.ok && !force) return;

    const slash = image.lastIndexOf("/");
    const colon = image.lastIndexOf(":");
    const has_tag = colon > slash;

    const res = await dockerRequest<string>({
        method: "POST",
        path: `/images/create`,
        query: {
            fromImage: has_tag ? image.slice(0, colon) : image,
            tag: has_tag ? image.slice(colon + 1) : "latest",
        },
        timeout_ms: 30 * 60 * 1000,
    });

    /**
     * The pull streams JSON lines; a failure mid-way is a line with
     * `error`, under a 200.
     */
    const failed = String(res.data || "")
        .split("\n")
        .map((line) => {
            try {
                return JSON.parse(line) as { error?: string };
            } catch {
                return null;
            }
        })
        .find((line) => line?.error);

    if ((!res.ok || failed) && !present.ok) {
        throw new Error(`Couldn't pull ${image}: ${failed?.error || res.message}`);
    }
}
