import { describe, expect, test } from "bun:test";
import graphicHeaders from "./graphic-headers";

describe("graphicHeaders", () => {
    const csp = graphicHeaders({ origin: "https://app.test" })["Content-Security-Policy"]!;
    const directives = csp.split("; ");

    test("sandboxes scripts away from the app's origin", () => {
        expect(directives).toContain("sandbox allow-scripts");
        expect(csp).not.toContain("allow-same-origin");
        expect(csp).not.toContain("allow-top-navigation");
        expect(csp).not.toContain("allow-popups");
    });

    test("allows no network beyond the app's graphic libraries", () => {
        expect(directives).toContain("default-src 'none'");
        expect(directives).toContain("connect-src 'none'");
        expect(directives).toContain("script-src 'unsafe-inline' https://app.test/graphics-lib/");
        expect(directives).toContain("img-src data: blob:");
    });

    test("is only framed by the app and never cached", () => {
        const headers = graphicHeaders({ origin: "https://app.test" });

        expect(directives).toContain("frame-ancestors 'self'");
        expect(headers["Cache-Control"]).toBe("private, no-store");
        expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    });
});
