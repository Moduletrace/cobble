import { describe, expect, test } from "bun:test";
import mcpUrlHostProblem from "./mcp-url-host";

describe("mcpUrlHostProblem (H6)", () => {
    test("a templated host is refused", () => {
        expect(mcpUrlHostProblem({ url: "https://{{env.HOST}}/mcp" })).toContain("fixed host");
        expect(mcpUrlHostProblem({ url: "https://api.{{env.REGION}}.example.com/mcp" })).toContain("fixed host");
        expect(mcpUrlHostProblem({ url: "https://{{args.host}}/mcp" })).toContain("fixed host");
    });

    test("a fixed host is allowed", () => {
        expect(mcpUrlHostProblem({ url: "https://mcp.exa.ai/mcp" })).toBeNull();
        expect(mcpUrlHostProblem({ url: "http://localhost:8170/mcp" })).toBeNull();
        expect(mcpUrlHostProblem({ url: "https://user:pw@mcp.exa.ai/mcp" })).toBeNull();
    });

    test("a template in the path, query or fragment is allowed (the host is still fixed)", () => {
        expect(mcpUrlHostProblem({ url: "https://mcp.exa.ai/{{env.PATH}}" })).toBeNull();
        expect(mcpUrlHostProblem({ url: "https://mcp.exa.ai/mcp?key={{env.KEY}}" })).toBeNull();
        expect(mcpUrlHostProblem({ url: "https://mcp.exa.ai/mcp#{{env.FRAG}}" })).toBeNull();
    });
});
