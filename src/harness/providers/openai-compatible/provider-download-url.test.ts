import { describe, expect, test } from "bun:test";
import providerDownloadUrlProblem from "./provider-download-url";

describe("providerDownloadUrlProblem", () => {
    test("a public https URL is safe to download", () => {
        expect(providerDownloadUrlProblem({ url: "https://cdn.example.com/img/1.png" })).toBeNull();
        expect(providerDownloadUrlProblem({ url: "https://8.8.8.8/x.png" })).toBeNull();
    });

    test("a non-https scheme is refused", () => {
        expect(providerDownloadUrlProblem({ url: "http://cdn.example.com/1.png" })).toContain("https");
        expect(providerDownloadUrlProblem({ url: "file:///etc/passwd" })).toContain("https");
        expect(providerDownloadUrlProblem({ url: "ftp://example.com/1.png" })).toContain("https");
    });

    test("a malformed URL is refused, not thrown", () => {
        expect(providerDownloadUrlProblem({ url: "not a url" })).toContain("can't be read");
        expect(providerDownloadUrlProblem({ url: "" })).toContain("can't be read");
    });

    test("loopback and unspecified addresses are refused", () => {
        expect(providerDownloadUrlProblem({ url: "https://127.0.0.1/1.png" })).toContain("internal");
        expect(providerDownloadUrlProblem({ url: "https://localhost/1.png" })).toContain("internal");
        expect(providerDownloadUrlProblem({ url: "https://0.0.0.0/1.png" })).toContain("internal");
        expect(providerDownloadUrlProblem({ url: "https://[::1]/1.png" })).toContain("internal");
    });

    test("link-local (cloud metadata) is refused", () => {
        expect(providerDownloadUrlProblem({ url: "https://169.254.169.254/latest/meta-data/" })).toContain("internal");
        expect(providerDownloadUrlProblem({ url: "https://metadata.google.internal/" })).toContain("internal");
        expect(providerDownloadUrlProblem({ url: "https://[fe80::1]/1.png" })).toContain("internal");
    });

    test("private LAN and CGNAT ranges are refused", () => {
        expect(providerDownloadUrlProblem({ url: "https://10.0.0.5/1.png" })).toContain("internal");
        expect(providerDownloadUrlProblem({ url: "https://192.168.1.10/1.png" })).toContain("internal");
        expect(providerDownloadUrlProblem({ url: "https://172.16.0.1/1.png" })).toContain("internal");
        expect(providerDownloadUrlProblem({ url: "https://172.31.255.255/1.png" })).toContain("internal");
        expect(providerDownloadUrlProblem({ url: "https://100.64.0.1/1.png" })).toContain("internal");
        expect(providerDownloadUrlProblem({ url: "https://[fd00::1]/1.png" })).toContain("internal");
    });

    test("an IPv4-mapped IPv6 loopback is refused", () => {
        expect(providerDownloadUrlProblem({ url: "https://[::ffff:127.0.0.1]/1.png" })).toContain("internal");
    });

    test("a public range next to a private one is not over-refused", () => {
        expect(providerDownloadUrlProblem({ url: "https://172.32.0.1/1.png" })).toBeNull();
        expect(providerDownloadUrlProblem({ url: "https://11.0.0.1/1.png" })).toBeNull();
        expect(providerDownloadUrlProblem({ url: "https://fcdn.example.com/1.png" })).toBeNull();
    });
});
