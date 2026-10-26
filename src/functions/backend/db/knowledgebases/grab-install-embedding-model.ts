import resolveHarnessCandidates from "@/src/harness/resolve/resolve-harness-candidates";

/**
 * The model the install embeds with now (the first candidate of the
 * default embedding setting), null when none is set or it's turned off.
 */
export default async function grabInstallEmbeddingModel() {
    const candidates = await resolveHarnessCandidates({ harness: "embedding" }).catch(() => []);

    return candidates[0]?.model.slug || null;
}
