import { describe, expect, test } from "bun:test";
import checkBrowserAddress from "./check-browser-address";

const network = { subnet: "172.18.0.0/16", gateway: "172.18.0.1" };

describe("checkBrowserAddress", () => {
    test("refuses anything inside the computers' network", () => {
        expect(checkBrowserAddress({ address: "172.18.0.5", network })).toContain("computers' network");
        expect(checkBrowserAddress({ address: "::ffff:172.18.3.9", network })).toContain("computers' network");
    });

    test("allows the gateway, which is the host", () => {
        expect(checkBrowserAddress({ address: "172.18.0.1", network })).toBeNull();
    });

    test("allows other docker bridges' gateway and private machines", () => {
        expect(checkBrowserAddress({ address: "172.17.0.1", network })).toBeNull();
        expect(checkBrowserAddress({ address: "192.168.1.40", network })).toBeNull();
        expect(checkBrowserAddress({ address: "100.64.0.7", network })).toBeNull();
    });

    test("refuses loopback in production, allows it beside a dev server", () => {
        expect(checkBrowserAddress({ address: "127.0.0.1", network })).toContain("this app");
        expect(checkBrowserAddress({ address: "::1", network })).toContain("this app");
        expect(checkBrowserAddress({ address: "127.0.0.1", network, allow_loopback: true })).toBeNull();
    });

    test("refuses link-local, where cloud metadata lives", () => {
        expect(checkBrowserAddress({ address: "169.254.169.254", network })).toContain("Link-local");
    });

    test("without a network it still refuses loopback", () => {
        expect(checkBrowserAddress({ address: "127.0.0.1" })).toContain("this app");
        expect(checkBrowserAddress({ address: "172.18.0.5" })).toBeNull();
    });
});
