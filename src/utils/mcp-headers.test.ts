import { describe, expect, test } from "bun:test";
import parseMcpHeaders, { composeMcpHeaders, envKeyFromTemplate, envTemplate, type McpAuth } from "./mcp-headers";

const none: McpAuth = { scheme: "none", name: "", secret: "" };

describe("parseMcpHeaders", () => {
    test("reads a bearer token as the authorization choice", () => {
        expect(parseMcpHeaders({ headers: { Authorization: "Bearer abc123", "X-Trace": "1" } })).toEqual({
            auth: { scheme: "bearer", name: "", secret: "abc123" },
            additional: [{ name: "X-Trace", value: "1" }],
        });
    });

    test("keeps Basic and other schemes as a header of their own", () => {
        expect(parseMcpHeaders({ headers: { authorization: "Basic dXNlcjpwYXNz" } })).toEqual({
            auth: none,
            additional: [{ name: "authorization", value: "Basic dXNlcjpwYXNz" }],
        });
    });

    test("reads an empty map as no authorization and no headers", () => {
        expect(parseMcpHeaders({ headers: {} })).toEqual({ auth: none, additional: [] });
        expect(parseMcpHeaders({})).toEqual({ auth: none, additional: [] });
    });
});

describe("composeMcpHeaders", () => {
    test("writes a bearer token back as the same header", () => {
        const parsed = parseMcpHeaders({ headers: { Authorization: "Bearer abc123" } });

        expect(composeMcpHeaders(parsed)).toEqual({ Authorization: "Bearer abc123" });
    });

    test("round trips hand-added headers, keeping colons in values", () => {
        const headers = { Authorization: "Bearer t", "X-Url": "http://a:1", Empty: "" };
        const parsed = parseMcpHeaders({ headers });

        expect(composeMcpHeaders(parsed)).toEqual(headers);
    });

    test("a custom header name carries the token", () => {
        expect(composeMcpHeaders({ auth: { scheme: "header", name: " X-API-Key ", secret: " k " }, additional: [] })).toEqual({
            "X-API-Key": "k",
        });
    });

    test("drops blank names and lets the authorization choice win its header", () => {
        expect(
            composeMcpHeaders({
                auth: { scheme: "bearer", name: "", secret: "t" },
                additional: [
                    { name: "  ", value: "x" },
                    { name: "authorization", value: "Basic a" },
                    { name: "X-A", value: "1" },
                    { name: "x-a", value: "2" },
                ],
            }),
        ).toEqual({ "x-a": "2", Authorization: "Bearer t" });
    });

    test("no authorization writes nothing", () => {
        expect(composeMcpHeaders({ auth: none, additional: [{ name: "X-A", value: "" }] })).toEqual({ "X-A": "" });
        expect(composeMcpHeaders({ auth: none, additional: [] })).toEqual({});
    });
});

describe("envKeyFromTemplate", () => {
    test("reads an env a value is exactly", () => {
        expect(envKeyFromTemplate({ text: " {{env.GITHUB_TOKEN}} " })).toBe("GITHUB_TOKEN");
        expect(envKeyFromTemplate({ text: envTemplate("A.B-1") })).toBe("A.B-1");
    });

    test("leaves text of its own and mixed templates literal", () => {
        expect(envKeyFromTemplate({ text: "" })).toBeNull();
        expect(envKeyFromTemplate({ text: "abc123" })).toBeNull();
        expect(envKeyFromTemplate({ text: "Basic {{env.CREDS}}" })).toBeNull();
        expect(envKeyFromTemplate({ text: "{{args.key}}" })).toBeNull();
    });
});
describe("parseMcpHeaders with a saved scheme", () => {
    test("reads a saved custom header back as the same scheme", () => {
        const fields = parseMcpHeaders({
            headers: { "X-API-Key": "{{env.KEY}}", "X-Extra": "1" },
            scheme: "header",
            header_name: "X-API-Key",
        });

        expect(fields.auth).toEqual({ scheme: "header", name: "X-API-Key", secret: "{{env.KEY}}" });
        expect(fields.additional).toEqual([{ name: "X-Extra", value: "1" }]);
        expect(composeMcpHeaders(fields)).toEqual({ "X-Extra": "1", "X-API-Key": "{{env.KEY}}" });
    });

    test("reads a saved bearer token back as bearer", () => {
        const fields = parseMcpHeaders({
            headers: { Authorization: "Bearer abc", Accept: "application/json" },
            scheme: "bearer",
        });

        expect(fields.auth).toEqual({ scheme: "bearer", name: "", secret: "abc" });
        expect(fields.additional).toEqual([{ name: "Accept", value: "application/json" }]);
    });

    test("a saved none leaves every header hand-added, Authorization included", () => {
        const fields = parseMcpHeaders({
            headers: { Authorization: "Basic abc" },
            scheme: "none",
            header_name: "X-API-Key",
        });

        expect(fields.auth.scheme).toBe("none");
        expect(fields.additional).toEqual([{ name: "Authorization", value: "Basic abc" }]);
    });

    test("a saved header whose header is gone keeps the name, with no secret", () => {
        expect(parseMcpHeaders({ headers: {}, scheme: "header", header_name: "X-API-Key" }).auth).toEqual({
            scheme: "header",
            name: "X-API-Key",
            secret: "",
        });
    });
});
