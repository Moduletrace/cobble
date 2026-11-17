import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";

let docker_ok = true;
let configs: { Subnet?: string; Gateway?: string }[] = [];

mock.module("@/src/functions/backend/docker/docker-request", () => ({
    default: async () => (docker_ok ? { ok: true, data: { IPAM: { Config: configs } } } : { ok: false }),
}));

const { default: assertBrowserUrl } = await import("./assert-browser-url");

afterAll(() => {
    mock.restore();
});

beforeEach(() => {
    docker_ok = true;
    configs = [{ Subnet: "172.18.0.0/16", Gateway: "172.18.0.1" }];
});

describe("assertBrowserUrl", () => {
    test("refuses an address inside the computers' network", async () => {
        await expect(assertBrowserUrl({ url: "http://172.18.0.5:3000/mcp" })).rejects.toThrow("computers' network");
    });

    test("allows the gateway, which is the host, and returns the checked address", async () => {
        expect(await assertBrowserUrl({ url: "http://172.18.0.1:3000/mcp" })).toEqual(["172.18.0.1"]);
    });

    test("fails closed when the computers' network can't be read", async () => {
        docker_ok = false;

        await expect(assertBrowserUrl({ url: "http://192.168.1.40:3000/mcp" })).rejects.toThrow(
            "Couldn't check that address",
        );
    });

    test("refuses an IPv6 address inside an IPv6 subnet", async () => {
        configs = [{ Subnet: "fd00:1::/64", Gateway: "fd00:1::1" }];

        await expect(assertBrowserUrl({ url: "http://[fd00:1::5]:3000/mcp" })).rejects.toThrow("computers' network");
        expect(await assertBrowserUrl({ url: "http://[fd00:1::1]:3000/mcp" })).toEqual(["fd00:1::1"]);
    });

    test("checks every IPAM config, not just the first", async () => {
        configs = [
            { Subnet: "10.9.0.0/16", Gateway: "10.9.0.1" },
            { Subnet: "172.18.0.0/16", Gateway: "172.18.0.1" },
        ];

        await expect(assertBrowserUrl({ url: "http://172.18.0.5:3000/mcp" })).rejects.toThrow("computers' network");
        await expect(assertBrowserUrl({ url: "http://10.9.0.5:3000/mcp" })).rejects.toThrow("computers' network");
    });

    test("still allows a member's own LAN machine", async () => {
        expect(await assertBrowserUrl({ url: "http://192.168.1.40:3000/mcp" })).toEqual(["192.168.1.40"]);
    });

    test("refuses a non-http URL", async () => {
        await expect(assertBrowserUrl({ url: "ftp://192.168.1.40/mcp" })).rejects.toThrow("http(s) URL");
    });
});
