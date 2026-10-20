export type ContentEncoding = "br" | "gzip";

type Params = {
    accept_encoding?: string | null;
    /**
     * The encodings the caller can produce, preferred first.
     */
    offer?: ContentEncoding[];
};

/**
 * The encoding to compress a response with for this `Accept-Encoding`:
 * the first of `offer` (brotli, then gzip) the client takes, else none. A
 * coding listed with `q=0` is refused, and `*` takes anything.
 */
export default function pickContentEncoding({
    accept_encoding,
    offer = ["br", "gzip"],
}: Params): ContentEncoding | null {
    if (!accept_encoding) return null;

    const accepted = new Set(
        accept_encoding
            .toLowerCase()
            .split(",")
            .map((part) => part.trim().split(";").map((piece) => piece.trim()))
            .filter(([, ...params]) => !params.some((param) => /^q=0(\.0*)?$/.test(param)))
            .map(([coding]) => coding),
    );

    return offer.find((encoding) => accepted.has(encoding) || accepted.has("*")) ?? null;
}
