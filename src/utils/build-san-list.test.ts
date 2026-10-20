import { describe, expect, test } from "bun:test";
import buildSanList from "./build-san-list";

describe("buildSanList", () => {
    test("always covers localhost", () => {
        expect(buildSanList({})).toEqual([
            "DNS:localhost",
            "IP:127.0.0.1",
            "IP:::1",
        ]);
    });

    test("adds the machine's name, its short form and its mDNS name", () => {
        const list = buildSanList({ hostname: "studio.tailnet.ts.net" });

        expect(list).toContain("DNS:studio.tailnet.ts.net");
        expect(list).toContain("DNS:studio");
        expect(list).toContain("DNS:studio.local");
    });

    test("does not invent localhost.local", () => {
        expect(buildSanList({ hostname: "localhost" })).toEqual([
            "DNS:localhost",
            "IP:127.0.0.1",
            "IP:::1",
        ]);
    });

    test("classifies addresses and names", () => {
        const list = buildSanList({
            addresses: ["192.168.1.20", "fe80::1"],
            hosts: ["cobble.tailnet.ts.net", "10.8.0.1"],
        });

        expect(list).toContain("IP:192.168.1.20");
        expect(list).toContain("IP:fe80::1");
        expect(list).toContain("DNS:cobble.tailnet.ts.net");
        expect(list).toContain("IP:10.8.0.1");
        expect(list).not.toContain("DNS:10.8.0.1");
    });

    test("deduplicates names regardless of case", () => {
        const list = buildSanList({
            hostname: "Studio",
            hosts: ["studio", "STUDIO.local"],
        });

        expect(list.filter((entry) => entry == "DNS:studio")).toHaveLength(1);
        expect(
            list.filter((entry) => entry == "DNS:studio.local"),
        ).toHaveLength(1);
    });

    test("ignores empty entries", () => {
        expect(buildSanList({ hosts: ["", "  "] })).toEqual([
            "DNS:localhost",
            "IP:127.0.0.1",
            "IP:::1",
        ]);
    });
});
