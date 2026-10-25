import { describe, expect, test } from "bun:test";
import clientIP, { isProxyAddress } from "./client-ip";

describe("isProxyAddress", () => {
    test("loopback and private networks", () => {
        for (const ip of ["127.0.0.1", "::1", "::ffff:127.0.0.1", "10.8.0.1", "192.168.1.4", "172.18.0.2", "fd00::1"]) {
            expect(isProxyAddress({ ip })).toBe(true);
        }
    });

    test("public addresses", () => {
        for (const ip of ["8.8.8.8", "172.32.0.1", "2001:db8::1"]) {
            expect(isProxyAddress({ ip })).toBe(false);
        }
    });
});

describe("clientIP", () => {
    test("a direct client is its connection's address, whatever it claims", () => {
        expect(clientIP({ peer: "203.0.113.9", forwarded_for: "1.2.3.4" })).toBe("203.0.113.9");
    });

    test("behind a proxy, the entry that proxy added", () => {
        expect(clientIP({ peer: "127.0.0.1", forwarded_for: "1.2.3.4, 203.0.113.9" })).toBe("203.0.113.9");
    });

    test("behind a proxy that sends X-Real-IP only", () => {
        expect(clientIP({ peer: "172.18.0.1", real_ip: "203.0.113.9" })).toBe("203.0.113.9");
    });

    test("a LAN client with no proxy headers is its own address", () => {
        expect(clientIP({ peer: "192.168.1.20" })).toBe("192.168.1.20");
    });

    test("nothing known", () => {
        expect(clientIP({})).toBeUndefined();
    });
});
