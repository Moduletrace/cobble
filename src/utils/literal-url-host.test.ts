import { describe, expect, test } from "bun:test";
import literalUrlHost from "./literal-url-host";

describe("literalUrlHost", () => {
    test("reads the host, without port or credentials", () => {
        expect(literalUrlHost({ url: "https://api.githubcopilot.com/mcp/" })).toBe("api.githubcopilot.com");
        expect(literalUrlHost({ url: "HTTP://Localhost:8170/mcp?k={{env.KEY}}" })).toBe("localhost");
        expect(literalUrlHost({ url: "https://user:pw@mcp.exa.ai/mcp" })).toBe("mcp.exa.ai");
    });

    test("refuses a host a template decides", () => {
        expect(literalUrlHost({ url: "https://{{args.host}}/x" })).toBeNull();
        expect(literalUrlHost({ url: "{{env.BASE_URL}}/mcp" })).toBeNull();
        expect(literalUrlHost({ url: "https://api.{{env.REGION}}.example.com/" })).toBeNull();
    });

    test("refuses anything that isn't http(s)", () => {
        expect(literalUrlHost({ url: "ftp://example.com/" })).toBeNull();
        expect(literalUrlHost({ url: "example.com/mcp" })).toBeNull();
        expect(literalUrlHost({ url: "https:///nohost" })).toBeNull();
    });
});
