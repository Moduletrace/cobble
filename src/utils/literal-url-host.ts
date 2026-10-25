type Params = {
    url: string;
};

/**
 * The host an http(s) URL goes to, lowercased, or null when it isn't
 * one or when a template (`{{env.KEY}}`, `{{args.x}}`) decides any part
 * of its scheme or host: where a key is sent has to be readable before
 * anyone approves it, and a bot must not be able to pick it per call.
 */
export default function literalUrlHost({ url }: Params) {
    const match = url.trim().match(/^(https?):\/\/([^/?#]*)/i);

    if (!match?.[2] || match[2].includes("{{") || match[2].includes("}}")) return null;

    const authority = match[2].split("@").pop() || "";
    const host = authority.replace(/:\d+$/, "").toLowerCase();

    return /^[a-z0-9.-]+$|^\[[0-9a-f:.]+\]$/.test(host) ? host : null;
}
