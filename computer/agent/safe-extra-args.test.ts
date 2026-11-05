import { describe, expect, test } from "bun:test";
import { BrowserBlockedArgs, McpBlockedArgs } from "./blocked-args";
import safeExtraArgs from "./safe-extra-args";

describe("safeExtraArgs", () => {
    test("keeps ordinary flags", () => {
        expect(safeExtraArgs({ text: " --force-dark-mode  --window-name=x ", blocked: BrowserBlockedArgs })).toEqual([
            "--force-dark-mode",
            "--window-name=x",
        ]);
    });

    test("drops flags that would open DevTools or move the profile", () => {
        expect(
            safeExtraArgs({
                text: "--remote-debugging-address=0.0.0.0 --REMOTE-DEBUGGING-PORT=1 --user-data-dir=/tmp --mute-audio",
                blocked: BrowserBlockedArgs,
            }),
        ).toEqual(["--mute-audio"]);
    });

    test("keeps Playwright MCP on loopback and this browser", () => {
        expect(safeExtraArgs({ text: "--host=0.0.0.0 --port 9 --caps vision --cdp-endpoint=x", blocked: McpBlockedArgs })).toEqual(["--caps", "vision"]);
    });

    test("nothing set is nothing", () => {
        expect(safeExtraArgs({ text: undefined, blocked: McpBlockedArgs })).toEqual([]);
    });
});
