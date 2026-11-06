type Params = {
    /**
     * The worker accounts' uids, inclusive.
     */
    uid_from: number;
    uid_to: number;
    /**
     * The computer's own services: none of them asks who's connecting.
     */
    ports: number[];
};

/**
 * The nftables rules that keep worker accounts off the computer's own
 * services on loopback (the screen, the shell, Chrome's DevTools,
 * Playwright MCP, the agent): their connections are reset. It replaces
 * the table whole, so applying it twice is the same as once.
 */
export default function guardRuleset({ uid_from, uid_to, ports }: Params) {
    const list = [...new Set(ports.map((port) => Math.trunc(port)).filter((port) => port > 0 && port < 65536))].sort(
        (a, b) => a - b,
    );

    if (!list.length) throw new Error("No ports to guard.");
    if (!(uid_from > 0 && uid_to >= uid_from)) throw new Error("No uids to guard.");

    return [
        "add table inet cobble_guard",
        "delete table inet cobble_guard",
        "table inet cobble_guard {",
        "    chain output {",
        "        type filter hook output priority filter; policy accept;",
        `        meta skuid ${Math.trunc(uid_from)}-${Math.trunc(uid_to)} tcp dport { ${list.join(", ")} } reject with tcp reset`,
        "    }",
        "}",
        "",
    ].join("\n");
}
