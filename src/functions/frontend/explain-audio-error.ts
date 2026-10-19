type Params = {
    /**
     * The streaming audio route the player failed on.
     */
    src: string;
    fallback?: string;
};

/**
 * An `<audio>` only says it failed, so ask its route again for the
 * reason: a failure answers in JSON, and audio coming back instead is
 * dropped at once.
 */
export default async function explainAudioError({
    src,
    fallback = "Couldn't play it. Try again.",
}: Params) {
    const controller = new AbortController();

    try {
        const res = await fetch(src, { signal: controller.signal, cache: "no-store" });

        if (!res.headers.get("content-type")?.includes("json")) {
            controller.abort();
            return fallback;
        }

        const json = await res.json();

        return json?.msg || fallback;
    } catch {
        return fallback;
    }
}
