import net from "net";

type Params = {
    /**
     * The machine's own name, as `os.hostname()` gives it. Its short form
     * and `<short>.local` are added too, since that is how a LAN reaches
     * it.
     */
    hostname?: string;
    /**
     * Addresses the app answers on.
     */
    addresses?: string[];
    /**
     * Names or addresses given by the user, e.g. a VPN's DNS name.
     */
    hosts?: string[];
};

/**
 * The `subjectAltName` entries a certificate is issued for: `DNS:name` for
 * a name, `IP:address` for an address, deduplicated. `localhost` and both
 * loopback addresses are always there, so `https://localhost` (and a
 * forwarded port) keep working.
 *
 * A name is classified by `net.isIP`, so a user can pass an address
 * wherever a host is expected without it becoming a useless DNS entry.
 */
export default function buildSanList({
    hostname,
    addresses,
    hosts,
}: Params): string[] {
    const entries: string[] = [];
    const seen = new Set<string>();

    const add = ({ type, value }: { type: "DNS" | "IP"; value: string }) => {
        const trimmed = value.trim();

        if (!trimmed) return;

        const entry = `${type}:${
            type == "DNS" ? trimmed.toLowerCase() : trimmed
        }`;
        const key = entry.toLowerCase();

        if (seen.has(key)) return;

        seen.add(key);
        entries.push(entry);
    };

    const addHost = (value: string) => {
        const trimmed = value.trim();

        if (!trimmed) return;

        add({ type: net.isIP(trimmed) ? "IP" : "DNS", value: trimmed });
    };

    add({ type: "DNS", value: "localhost" });
    add({ type: "IP", value: "127.0.0.1" });
    add({ type: "IP", value: "::1" });

    const own = (hostname ?? "").trim();

    if (own) {
        addHost(own);

        const short = own.split(".")[0];

        if (short && short != "localhost") {
            add({ type: "DNS", value: short });

            if (short != own) add({ type: "DNS", value: `${short}.local` });
        }
    }

    for (const address of addresses ?? []) addHost(address);
    for (const host of hosts ?? []) addHost(host);

    return entries;
}
