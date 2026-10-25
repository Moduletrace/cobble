import { describe, expect, test } from "bun:test";
import extensionEnvUses from "./extension-env-uses";

describe("extensionEnvUses", () => {
    test("reads an MCP server's host and the envs its URL and headers send", () => {
        expect(
            extensionEnvUses({
                kind: "mcp",
                data: {
                    name: "GitHub",
                    description: "",
                    transport: "remote",
                    url: "https://api.githubcopilot.com/mcp/?region={{env.REGION}}",
                    headers: { Authorization: "Bearer {{ env.GITHUB_TOKEN }}", Accept: "application/json" },
                    command: "",
                    setup_command: "",
                    env: {},
                    excluded_tools: [],
                    enabled: true,
                    all_bots: false,
                },
            }),
        ).toEqual({
            host: "api.githubcopilot.com",
            sends: [
                { key: "REGION", where: "URL" },
                { key: "GITHUB_TOKEN", where: "header Authorization" },
            ],
        });
    });

    test("reads an HTTP tool's URL, headers and body", () => {
        expect(
            extensionEnvUses({
                kind: "tool",
                data: {
                    name: "weather",
                    description: "d",
                    parameters: { type: "object" },
                    enabled: true,
                    all_bots: false,
                    kind: "http",
                    config: {
                        method: "POST",
                        url: "https://api.weather.example/v1?key={{env.WEATHER_KEY}}",
                        headers: {},
                        body: `{"token":"{{env.WEATHER_KEY}}","city":"{{args.city}}"}`,
                    },
                },
            }),
        ).toEqual({
            host: "api.weather.example",
            sends: [
                { key: "WEATHER_KEY", where: "URL" },
                { key: "WEATHER_KEY", where: "body" },
            ],
        });
    });

    test("a script sends nothing from the app", () => {
        expect(
            extensionEnvUses({
                kind: "tool",
                data: {
                    name: "count",
                    description: "d",
                    parameters: { type: "object" },
                    enabled: true,
                    all_bots: false,
                    kind: "script",
                    config: { language: "bash", code: "echo {{env.X}}" },
                },
            }),
        ).toEqual({ host: null, sends: [] });
    });
});
