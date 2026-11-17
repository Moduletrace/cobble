type Params = {
    /**
     * An IP address the browser's host resolves to.
     */
    address: string;
    /**
     * The computers' docker network, every IPAM config it has (a network
     * can carry more than one subnet, IPv4 and IPv6).
     */
    networks?: { subnet?: string; gateway?: string }[] | null;
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

/**
 * An IPv6 address as a 128-bit number, or null when it isn't one. Expands
 * `::`, and turns a trailing IPv4 (`::ffff:1.2.3.4`) into two hex groups so
 * a mapped address still matches an IPv6 subnet.
 */
function ipv6Number({ address }: { address: string }): bigint | null {
    let addr = address;
    const lastColon = addr.lastIndexOf(":");
    const tail = addr.slice(lastColon + 1);

    if (tail.includes(".")) {
        const v4 = ipv4Number({ address: tail });

        if (v4 === null) return null;

        addr = `${addr.slice(0, lastColon + 1)}${(v4 >>> 16).toString(16)}:${(v4 & 0xffff).toString(16)}`;
    }

    const halves = addr.split("::");

    if (halves.length > 2) return null;

    const groupsOf = (part: string) => (part == "" ? [] : part.split(":"));
    let groups: string[];

    if (halves.length == 2) {
        const head = groupsOf(halves[0]!);
        const rest = groupsOf(halves[1]!);
        const fill = 8 - head.length - rest.length;

        if (fill < 0) return null;

        groups = [...head, ...Array(fill).fill("0"), ...rest];
    } else {
        groups = groupsOf(addr);
    }

    if (groups.length != 8) return null;

    let value = 0n;

    for (const group of groups) {
        if (!/^[0-9a-f]{1,4}$/i.test(group)) return null;

        value = (value << 16n) | BigInt(parseInt(group, 16));
    }

    return value;
}

function inSubnet({ address, subnet }: { address: string; subnet: string }) {
    const [base, bits] = subnet.split("/");
    const size = Number(bits);

    if (!Number.isInteger(size)) return false;

    if ((base || "").includes(":")) {
        const value = ipv6Number({ address });
        const start = ipv6Number({ address: base || "" });

        if (value === null || start === null || size < 0 || size > 128) return false;

        const mask = size == 0 ? 0n : ((1n << 128n) - 1n) ^ ((1n << BigInt(128 - size)) - 1n);

        return (value & mask) == (start & mask);
    }

    const value = ipv4Number({ address });
    const start = ipv4Number({ address: base || "" });

    if (value === null || start === null || size < 0 || size > 32) return false;

    const mask = size == 0 ? 0 : (~0 << (32 - size)) >>> 0;

    return (value & mask) >>> 0 == (start & mask) >>> 0;
}

/**
 * Whether two addresses are the same host, comparing IPv6 by value so a
 * compressed and an expanded spelling of one address still match.
 */
function sameAddress(a: string, b: string) {
    if (a.includes(":") || b.includes(":")) {
        const av = ipv6Number({ address: a });
        const bv = ipv6Number({ address: b });

        return av !== null && bv !== null && av == bv;
    }

    return a == b;
}

/**
 * Why a browser's address can't be used, or null when it can. The app
 * makes the connection, so without this a user could point a "browser" at
 * a computer's own MCP endpoint and walk out of its folders, or at the
 * cloud's metadata service. The docker gateway stays allowed: that's the
 * host, where a browser on the same machine is. Other private LAN space is
 * allowed by design - a member runs their browser on their own laptop.
 */
export default function checkBrowserAddress({ address, networks, allow_loopback }: Params): string | null {
    const plain = address.replace(/^::ffff:/i, "").toLowerCase();
    const is_loopback = plain == "::1" || plain.startsWith("127.") || plain == "0.0.0.0" || plain == "::";

    if (is_loopback) return allow_loopback ? null : `That address is this app itself.`;

    if (plain.startsWith("169.254.") || plain.startsWith("fe80:")) return `Link-local addresses can't be used.`;

    if (networks?.some((network) => network.gateway && sameAddress(plain, network.gateway.toLowerCase()))) return null;

    if (networks?.some((network) => network.subnet && inSubnet({ address: plain, subnet: network.subnet }))) {
        return `That address is inside the computers' network, not a browser.`;
    }

    return null;
}
