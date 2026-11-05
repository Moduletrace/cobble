import type { IncomingMessage } from "node:http";

/**
 * A request's JSON body (at most `max_bytes`), or null when it isn't JSON.
 */
export default async function readJsonBody({ req, max_bytes }: { req: IncomingMessage; max_bytes: number }): Promise<any> {
    const chunks: Buffer[] = [];
    let size = 0;

    for await (const chunk of req) {
        size += chunk.length;

        if (size > max_bytes) throw new Error(`The body is over ${max_bytes} bytes.`);

        chunks.push(chunk);
    }

    try {
        return JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
        return null;
    }
}
