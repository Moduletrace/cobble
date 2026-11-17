import { describe, expect, test } from "bun:test";
import checkBrowserAddress from "./check-browser-address";

const networks = [{ subnet: "172.18.0.0/16", gateway: "172.18.0.1" }];

describe("checkBrowserAddress", () => {
    test("refuses anything inside the computers' network", () => {
        expect(checkBrowserAddress({ address: "172.18.0.5", networks })).toContain("computers' network");
        expect(checkBrowserAddress({ address: "::ffff:172.18.3.9", networks })).toContain("computers' network");
    });

    test("allows the gateway, which is the host", () => {
        expect(checkBrowserAddress({ address: "172.18.0.1", networks })).toBeNull();
    });

    test("allows other docker bridges' gateway and private machines", () => {
        expect(checkBrowserAddress({ address: "172.17.0.1", networks })).toBeNull();
        expect(checkBrowserAddress({ address: "192.168.1.40", networks })).toBeNull();
        expect(checkBrowserAddress({ address: "100.64.0.7", networks })).toBeNull();
    });

    test("refuses loopback in production, allows it beside a dev server", () => {
        expect(checkBrowserAddress({ address: "127.0.0.1", networks })).toContain("this app");
        expect(checkBrowserAddress({ address: "::1", networks })).toContain("this app");
        expect(checkBrowserAddress({ address: "127.0.0.1", networks, allow_loopback: true })).toBeNull();
    });

    test("refuses link-local, where cloud metadata lives", () => {
        expect(checkBrowserAddress({ address: "169.254.169.254", networks })).toContain("Link-local");
    });

    test("without a network it still refuses loopback", () => {
        expect(checkBrowserAddress({ address: "127.0.0.1" })).toContain("this app");
        expect(checkBrowserAddress({ address: "172.18.0.5" })).toBeNull();
    });

    test("refuses an IPv6 address inside an IPv6 subnet, allows its gateway", () => {
        const v6 = [{ subnet: "fd00:1::/64", gateway: "fd00:1::1" }];

        expect(checkBrowserAddress({ address: "fd00:1::5", networks: v6 })).toContain("computers' network");
        expect(checkBrowserAddress({ address: "fd00:0001:0000:0000:0000:0000:0000:0005", networks: v6 })).toContain(
            "computers' network",
        );
        expect(checkBrowserAddress({ address: "fd00:1::1", networks: v6 })).toBeNull();
        expect(checkBrowserAddress({ address: "fd00:2::5", networks: v6 })).toBeNull();
    });

    test("checks every IPAM config, not just the first", () => {
        const many = [
            { subnet: "10.9.0.0/16", gateway: "10.9.0.1" },
            { subnet: "172.18.0.0/16", gateway: "172.18.0.1" },
        ];

        expect(checkBrowserAddress({ address: "172.18.0.5", networks: many })).toContain("computers' network");
        expect(checkBrowserAddress({ address: "10.9.0.5", networks: many })).toContain("computers' network");
        expect(checkBrowserAddress({ address: "10.9.0.1", networks: many })).toBeNull();
    });
});
