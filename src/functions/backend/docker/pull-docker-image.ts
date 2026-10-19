import dockerRequest from "./docker-request";

type Params = {
    /**
     * e.g. `ghcr.io/agent-infra/sandbox:latest`.
     */
    image: string;
};

/**
 * Pulls an image unless docker already has it. Waits for the whole pull,
 * which can take minutes for a large image.
 */
export default async function pullDockerImage({ image }: Params) {
    const present = await dockerRequest({ path: `/images/${encodeURIComponent(image)}/json` });

    if (present.ok) return;

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

    if (!res.ok || failed) {
        throw new Error(`Couldn't pull ${image}: ${failed?.error || res.message}`);
    }
}
