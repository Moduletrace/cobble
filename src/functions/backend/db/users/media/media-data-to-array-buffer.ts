import type { MediaDataType } from "@/src/types";

export default async function MediaDataToArrayBuffer(
    body: MediaDataType,
): Promise<ArrayBuffer> {
    if (body == null) {
        return new ArrayBuffer(0);
    }
    if (body instanceof ArrayBuffer) {
        return body;
    }
    if (body instanceof SharedArrayBuffer) {
        const copy = new ArrayBuffer(body.byteLength);
        new Uint8Array(copy).set(new Uint8Array(body));
        return copy;
    }
    if (typeof body === "string") {
        return new TextEncoder().encode(body).buffer as ArrayBuffer;
    }
    if (body instanceof ReadableStream) {
        return Bun.readableStreamToArrayBuffer(body);
    }
    // Blob, BunFile, Request, Response — wrap in Response and use Bun's reader
    return new Response(body as BodyInit)
        .bytes()
        .then((b) => b.buffer as ArrayBuffer);
}
