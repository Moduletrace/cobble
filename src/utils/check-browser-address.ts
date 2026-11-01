type Params = {
    /**
     * An IP address the browser's host resolves to.
     */
    address: string;
    /**
     * The computers' docker network.
     */
    network?: { subnet?: string; gateway?: string } | null;
    /**
     * Whether this machine's own addresses may be used: a dev server beside
     * the browser, never the app container, where it means the app itself.
     */
    allow_loopback?: boolean;
};

function ipv4Number({ address }: { address: string }) {
    const parts = address.split(".").map(Number);

    if (parts.length != 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return null;

    return ((parts[0]! << 24) | (parts[1]! << 16) | (parts[2]! << 8) | parts[3]!) >>> 0;
}

function inSubnet({ address, subnet }: { address: string; subnet: string }) {
    const [base, bits] = subnet.split("/");
    const value = ipv4Number({ address });
    const start = ipv4Number({ address: base || "" });
    const size = Number(bits);

    if (value === null || start === null || !Number.isInteger(size)) return false;

    const mask = size == 0 ? 0 : (~0 << (32 - size)) >>> 0;

    return (value & mask) >>> 0 == (start & mask) >>> 0;
}

/**
 * Why a browser's address can't be used, or null when it can. The app
 * makes the connection, so without this a user could point a "browser" at
 * a computer's own MCP endpoint and walk out of its folders, or at the
 * cloud's metadata service. The docker gateway stays allowed: that's the
 * host, where a browser on the same machine is.
 */
export default function checkBrowserAddress({ address, network, allow_loopback }: Params): string | null {
    const plain = address.replace(/^::ffff:/i, "").toLowerCase();
    const is_loopback = plain == "::1" || plain.startsWith("127.") || plain == "0.0.0.0" || plain == "::";

    if (is_loopback) return allow_loopback ? null : `That address is this app itself.`;

    if (plain.startsWith("169.254.") || plain.startsWith("fe80:")) return `Link-local addresses can't be used.`;

    if (plain == network?.gateway) return null;

    if (network?.subnet && inSubnet({ address: plain, subnet: network.subnet })) {
        return `That address is inside the computers' network, not a browser.`;
    }

    return null;
}
