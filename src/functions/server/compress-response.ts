import { brotliCompress, constants } from "node:zlib";
import { promisify } from "node:util";
import { AppData } from "@/src/data/app-data";
import isCompressibleType from "@/src/utils/is-compressible-type";
import isHashedAssetPath from "@/src/utils/is-hashed-asset-path";
import pickContentEncoding, { type ContentEncoding } from "@/src/utils/pick-content-encoding";

const BrotliCompress = promisify(brotliCompress);

type Params = {
    req: Request;
    response: Response;
};

/**
 * Page scripts and styles, compressed once per path and encoding. Their
 * names are their content, so an entry never goes stale.
 */
const HashedAssetCache = new Map<string, Uint8Array<ArrayBuffer>>();
let HashedAssetCacheBytes = 0;
/**
 * Compressions in progress, so parallel requests for a cold asset share
 * one pass rather than each blocking a brotli run.
 */
const HashedAssetInflight = new Map<string, Promise<Uint8Array<ArrayBuffer>>>();

/**
 * Compresses a text response for a client that takes it, and caches the
 * content-named page scripts and styles for good (bunext gives them an
 * hour, with nothing to revalidate against).
 *
 * Page scripts and styles are compressed whole (brotli or gzip) and kept
 * in memory; pages and API responses are gzipped as they stream. Media,
 * streams, small bodies and anything already encoded go out as they are.
 */
export default async function compressResponse({ req, response }: Params): Promise<Response> {
    const { pathname } = new URL(req.url);
    const hashed = response.status == 200 && isHashedAssetPath({ pathname });

    if (hashed) {
        response.headers.set("Cache-Control", "public, max-age=31536000, immutable");
        /**
         * The same path serves a different body per encoding, so a shared
         * cache must key on it even when this client gets the plain one.
         */
        appendVary({ headers: response.headers });
    }

    if (
        !response.body ||
        response.status != 200 ||
        response.headers.has("Content-Encoding") ||
        !isCompressibleType({ content_type: response.headers.get("Content-Type") })
    ) {
        return response;
    }

    const length = Number(response.headers.get("Content-Length"));

    if (length && length < AppData["CompressMinBytes"]) return response;

    const accept_encoding = req.headers.get("Accept-Encoding");
    const encoding = hashed
        ? pickContentEncoding({ accept_encoding })
        : pickContentEncoding({ accept_encoding, offer: ["gzip"] });

    if (!encoding) return response;

    const headers = new Headers(response.headers);

    headers.set("Content-Encoding", encoding);
    headers.delete("Content-Length");
    headers.delete("Content-Disposition");
    appendVary({ headers });

    if (hashed) {
        const body = await compressHashedAsset({ pathname, encoding, response });

        return new Response(body, { status: response.status, headers });
    }

    return new Response(response.body.pipeThrough(new CompressionStream("gzip")), {
        status: response.status,
        statusText: response.statusText,
        headers,
    });
}

async function compressHashedAsset({
    pathname,
    encoding,
    response,
}: {
    pathname: string;
    encoding: ContentEncoding;
    response: Response;
}): Promise<Uint8Array<ArrayBuffer>> {
    const key = `${encoding}:${pathname}`;
    const cached = HashedAssetCache.get(key);

    if (cached) {
        response.body?.cancel().catch(() => {});
        return cached;
    }

    const inflight = HashedAssetInflight.get(key);

    if (inflight) {
        response.body?.cancel().catch(() => {});
        return await inflight;
    }

    const compression = compressBody({ encoding, response });

    HashedAssetInflight.set(key, compression);

    try {
        const body = await compression;

        rememberHashedAsset({ key, body });

        return body;
    } finally {
        HashedAssetInflight.delete(key);
    }
}

async function compressBody({
    encoding,
    response,
}: {
    encoding: ContentEncoding;
    response: Response;
}): Promise<Uint8Array<ArrayBuffer>> {
    const bytes = new Uint8Array(await response.arrayBuffer());

    if (encoding == "gzip") return new Uint8Array(Bun.gzipSync(bytes, { level: 9 }));

    return new Uint8Array(
        await BrotliCompress(bytes, {
            params: {
                [constants.BROTLI_PARAM_QUALITY]: AppData["CompressBrotliQuality"],
                [constants.BROTLI_PARAM_SIZE_HINT]: bytes.length,
            },
        }),
    );
}

function rememberHashedAsset({
    key,
    body,
}: {
    key: string;
    body: Uint8Array<ArrayBuffer>;
}) {
    HashedAssetCache.set(key, body);
    HashedAssetCacheBytes += body.byteLength;

    while (
        HashedAssetCache.size > AppData["CompressCacheMaxFiles"] ||
        HashedAssetCacheBytes > AppData["CompressCacheMaxBytes"]
    ) {
        const oldest = HashedAssetCache.keys().next().value;

        if (!oldest) break;

        const dropped = HashedAssetCache.get(oldest);

        HashedAssetCache.delete(oldest);
        HashedAssetCacheBytes -= dropped?.byteLength || 0;
    }
}

/**
 * Adds `Accept-Encoding` to `Vary` once, whatever the response already
 * varies on.
 */
function appendVary({ headers }: { headers: Headers }) {
    const vary = headers.get("Vary");

    if (!vary) {
        headers.set("Vary", "Accept-Encoding");
        return;
    }

    if (!vary.split(",").some((part) => part.trim().toLowerCase() == "accept-encoding")) {
        headers.set("Vary", `${vary}, Accept-Encoding`);
    }
}
