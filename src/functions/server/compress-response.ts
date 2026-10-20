import { brotliCompressSync, constants } from "node:zlib";
import { AppData } from "@/src/data/app-data";
import isCompressibleType from "@/src/utils/is-compressible-type";
import isHashedAssetPath from "@/src/utils/is-hashed-asset-path";
import pickContentEncoding, { type ContentEncoding } from "@/src/utils/pick-content-encoding";

type Params = {
    req: Request;
    response: Response;
};

/**
 * Page scripts and styles, compressed once per path and encoding. Their
 * names are their content, so an entry never goes stale.
 */
const HashedAssetCache = new Map<string, Uint8Array<ArrayBuffer>>();

/**
 * Compresses a text response for a client that takes it, and caches the
 * content-named page scripts and styles for good (bunext gives them an
 * hour, with nothing to revalidate against).
 *
 * Page scripts and styles are compressed whole (brotli or gzip) and kept
 * in memory; pages and API responses are gzipped as they stream. Media,
 * streams, small bodies and anything already encoded go out as they
 * are.
 */
export default async function compressResponse({ req, response }: Params): Promise<Response> {
    const { pathname } = new URL(req.url);
    const hashed = response.status == 200 && isHashedAssetPath({ pathname });

    if (hashed) {
        response.headers.set("Cache-Control", "public, max-age=31536000, immutable");
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
    headers.append("Vary", "Accept-Encoding");

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

    const bytes = new Uint8Array(await response.arrayBuffer());
    const body =
        encoding == "br"
            ? new Uint8Array(
                  brotliCompressSync(bytes, {
                      params: {
                          [constants.BROTLI_PARAM_QUALITY]: AppData["CompressBrotliQuality"],
                          [constants.BROTLI_PARAM_SIZE_HINT]: bytes.length,
                      },
                  }),
              )
            : Bun.gzipSync(bytes, { level: 9 });

    HashedAssetCache.set(key, body);

    if (HashedAssetCache.size > AppData["CompressCacheMaxFiles"]) {
        const oldest = HashedAssetCache.keys().next().value;

        if (oldest) HashedAssetCache.delete(oldest);
    }

    return body;
}
