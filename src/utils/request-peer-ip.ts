/**
 * The address each request's connection came from, as `Bun.serve` saw it
 * (`server.requestIP`). Recorded by `src/server.ts` before the request is
 * handed on, since API routes only get the `Request`.
 */
const peers = new WeakMap<Request, string>();

export function setRequestPeerIP({ req, ip }: { req: Request; ip?: string | null }) {
    if (ip) peers.set(req, ip);
}

export function grabRequestPeerIP({ req }: { req: Request }) {
    return peers.get(req);
}
