import type { MediaDataType } from "@/src/types";

export default async function mediaDataToSharpInput(
    body: MediaDataType,
): Promise<Buffer> {
    if (body instanceof Buffer) return body;
    if (body instanceof SharedArrayBuffer)
        return Buffer.from(new Uint8Array(body));
    if (body instanceof ArrayBuffer) return Buffer.from(body);
    if (body instanceof Uint8Array) return Buffer.from(body);
    if (body instanceof Blob || body instanceof File)
        return Buffer.from(await body.arrayBuffer());
    if (body instanceof Response || body instanceof Request)
        return Buffer.from(await body.arrayBuffer());
    if (typeof body === "string") return Buffer.from(body, "base64");
    if (ArrayBuffer.isView(body))
        return Buffer.from(body.buffer, body.byteOffset, body.byteLength);

    if ("arrayBuffer" in body && typeof body.arrayBuffer === "function") {
        return Buffer.from(await (body as any).arrayBuffer());
    }

    throw new Error(`Unsupported body type: ${typeof body}`);
}
