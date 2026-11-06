import { describe, expect, test } from "bun:test";
import computerBrowserEnv from "./computer-browser-env";
import parseComputerBrowserSettings from "./parse-computer-browser-settings";

describe("computerBrowserEnv", () => {
    test("passes every setting given", () => {
        expect(
            computerBrowserEnv({
                settings: {
                    timezone: "Africa/Lagos",
                    language: "en-GB",
                    accept_languages: "en-GB, en",
                    screen: "1366x768",
                    scale: "100",
                    sandbox: false,
                    lightweight: true,
                    browser_args: "--mute-audio",
                    mcp_args: "--caps vision",
                },
                fallback_timezone: "UTC",
            }),
        ).toEqual([
            "TZ=Africa/Lagos",
            "COBBLE_SCREEN=1366x768",
            "COBBLE_BROWSER_SCALE=1",
            "COBBLE_BROWSER_LANG=en-GB",
            "COBBLE_BROWSER_ACCEPT_LANG=en-GB,en",
            "COBBLE_BROWSER_SANDBOX=false",
            "COBBLE_BROWSER_LIGHTWEIGHT=true",
            "COBBLE_BROWSER_ARGS=--mute-audio",
            "COBBLE_MCP_ARGS=--caps vision",
        ]);
    });

    test("nothing set leaves the agent's defaults, with the app's timezone", () => {
        expect(computerBrowserEnv({ settings: {}, fallback_timezone: "Europe/Helsinki" })).toEqual(["TZ=Europe/Helsinki"]);
        expect(computerBrowserEnv({ settings: { sandbox: true, scale: "125", lightweight: false } })).toEqual([]);
    });
});

describe("parseComputerBrowserSettings", () => {
    test("reads stored settings and drops ones that no longer pass", () => {
        expect(parseComputerBrowserSettings({ text: '{"screen":"1366x768","language":""}' })).toEqual({ screen: "1366x768" });
        expect(parseComputerBrowserSettings({ text: '{"browser_args":"--remote-debugging-address=0.0.0.0"}' })).toEqual({});
        expect(parseComputerBrowserSettings({ text: "not json" })).toEqual({});
        expect(parseComputerBrowserSettings({ text: null })).toEqual({});
    });
});
