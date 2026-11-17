type Params = {
    url: string;
};

/**
 * Why a URL a provider hands back can't be downloaded, or null when it's
 * safe to fetch (H4). Only `https:` is allowed (a plain-HTTP body can be
 * rewritten in transit), and a literal internal address is refused so a
 * hostile or compromised provider can't aim the app at its own loopback,
 * the cloud metadata service or the computers' docker network. The bytes
 * are saved as a bot file the bot can read back into chat, so this is a
 * read-back SSRF guard, not just a fetch policy.
 */
export default function providerDownloadUrlProblem({ url }: Params): string | null {
    let parsed: URL;

    try {
        parsed = new URL(url);
    } catch {
        return "returned a file URL that can't be read.";
    }

    if (parsed.protocol != "https:") {
        return "returned a file URL that isn't https.";
    }

    if (internalDownloadHost(parsed.hostname)) {
        return "returned a file URL pointing at an internal address.";
    }

    return null;
}

/**
 * A literal internal host: loopback, link-local (cloud metadata), private
 * LAN, CGNAT, or a name that only resolves inside the install. Hostnames
 * are checked as written - a provider's public CDN passes; DNS rebinding
 * of a public name is the browser-URL guard's job (H5), not this one.
 */
function internalDownloadHost(hostname: string): boolean {
    const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");

    if (host == "localhost" || host.endsWith(".localhost") || host.endsWith(".internal") || host.endsWith(".local")) {
        return true;
    }

    if (host.includes(":")) {
        if (host == "::1" || host == "::") return true;
        if (host.startsWith("fe80:") || host.startsWith("fc") || host.startsWith("fd")) return true;
        if (host.startsWith("::ffff:")) return internalMappedV4(host.slice(7));

        return false;
    }

    if (host == "0.0.0.0") return true;

    const octets = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);

    if (octets) {
        const a = Number(octets[1]);
        const b = Number(octets[2]);

        if (a == 127 || a == 10 || a == 0) return true;
        if (a == 169 && b == 254) return true;
        if (a == 192 && b == 168) return true;
        if (a == 172 && b >= 16 && b <= 31) return true;
        if (a == 100 && b >= 64 && b <= 127) return true;
    }

    return false;
}

/**
 * The IPv4 inside an IPv4-mapped IPv6 address (`::ffff:`). The URL parser
 * may hand it back dotted (`127.0.0.1`) or as two hex groups (`7f00:1`),
 * so both are turned into the four octets and checked as IPv4.
 */
function internalMappedV4(tail: string): boolean {
    if (tail.includes(".")) return internalDownloadHost(tail);

    const groups = tail.split(":");

    if (groups.length == 2) {
        const hi = parseInt(groups[0]!, 16);
        const lo = parseInt(groups[1]!, 16);

        if (!Number.isNaN(hi) && !Number.isNaN(lo)) {
            return internalDownloadHost(`${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`);
        }
    }

    return false;
}
