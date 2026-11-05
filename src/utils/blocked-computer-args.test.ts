import { describe, expect, test } from "bun:test";
import { ComputerBlockedBrowserArgs, ComputerBlockedMcpArgs } from "@/src/dict/computer-dict";
import blockedComputerArgs from "./blocked-computer-args";

describe("blockedComputerArgs", () => {
    test("names the flags that would open DevTools or move the browser", () => {
        expect(
            blockedComputerArgs({ text: "--mute-audio --Remote-Debugging-Address=0.0.0.0 --user-data-dir /x", blocked: ComputerBlockedBrowserArgs }),
        ).toEqual(["--remote-debugging-address", "--user-data-dir"]);
    });

    test("names Playwright MCP flags that would move it off loopback", () => {
        expect(blockedComputerArgs({ text: "--caps vision --host 0.0.0.0", blocked: ComputerBlockedMcpArgs })).toEqual(["--host"]);
    });

    test("ordinary flags and nothing pass", () => {
        expect(blockedComputerArgs({ text: "--caps vision", blocked: ComputerBlockedMcpArgs })).toEqual([]);
        expect(blockedComputerArgs({ text: null, blocked: ComputerBlockedMcpArgs })).toEqual([]);
    });
});
