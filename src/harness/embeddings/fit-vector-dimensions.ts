import { AppData } from "@/src/data/app-data";

type Params = {
    vector: number[];
    /**
     * Defaults to `AppData.EmbeddingDimensions`, the width of the fixed
     * `knowledgebase_vectors` table.
     */
    dimensions?: number;
};

/**
 * Makes a provider's vector the width the vector table takes: cut when
 * it's wider, padded with zeros when narrower, then normalized to unit
 * length so cosine distance means the same for every model.
 */
export default function fitVectorDimensions({
    vector,
    dimensions = AppData.EmbeddingDimensions,
}: Params): Float32Array<ArrayBuffer> {
    const out = new Float32Array(new ArrayBuffer(dimensions * 4));
    const length = Math.min(vector.length, dimensions);

    let sum = 0;

    for (let i = 0; i < length; i++) {
        const raw = Number(vector[i]);
        // A non-finite value (Infinity, NaN) would turn the whole vector
        // into NaN once normalized; treat it as zero instead (L8).
        const value = Number.isFinite(raw) ? raw : 0;

        out[i] = value;
        sum += value * value;
    }

    /**
     * A zero vector can't be normalized; leave it as zeros (it then
     * matches nothing).
     */
    const norm = Math.sqrt(sum);

    if (norm > 0) {
        for (let i = 0; i < dimensions; i++) {
            out[i] = out[i]! / norm;
        }
    }

    return out;
}
