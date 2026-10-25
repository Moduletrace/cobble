type Params = {
    /**
     * The connection's own address (`server.requestIP`).
     */
    peer?: string | null;
    /**
     * The request's `X-Forwarded-For`.
     */
    forwarded_for?: string | null;
    /**
     * The request's `X-Real-IP`.
     */
    real_ip?: string | null;
};

/**
 * Whether an address is this machine or a private network: where a reverse
 * proxy or tunnel in front of the app connects from.
 */
export function isProxyAddress({ ip }: { ip: string }) {
    const address = ip.replace(/^::ffff:/i, "").toLowerCase();

    return (
        address == "::1" ||
        address.startsWith("127.") ||
        address.startsWith("10.") ||
        address.startsWith("192.168.") ||
        /^172\.(1[6-9]|2\d|3[01])\./.test(address) ||
        address.startsWith("fc") ||
        address.startsWith("fd") ||
        address.startsWith("fe80:")
    );
}

/**
 * The client's address, for rate limits and the audit log. The forwarded
 * headers are only believed when the connection came from a proxy
 * (`isProxyAddress`), and then only the last `X-Forwarded-For` entry,
 * the one that proxy added itself: anything before it is whatever the
 * client chose to send. Otherwise the connection's own address wins, so a
 * client can't pick a fresh address per request to dodge a limit.
 */
export default function clientIP({ peer, forwarded_for, real_ip }: Params) {
    const behind_proxy = !peer || isProxyAddress({ ip: peer });

    if (behind_proxy) {
        const forwarded = (forwarded_for || "")
            .split(",")
            .map((entry) => entry.trim())
            .filter(Boolean)
            .at(-1);

        if (forwarded) return forwarded;

        if (real_ip?.trim()) return real_ip.trim();
    }

    return peer || undefined;
}
