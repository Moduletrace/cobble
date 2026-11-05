import { describe, expect, test } from "bun:test";
import computerProxyPathAllowed from "./computer-proxy-path-allowed";

describe("computerProxyPathAllowed", () => {
    test("passes the screen to anyone who reaches the computer", () => {
        for (const rest of ["desktop", "desktop/", "desktop/app/ui.js", "desktop/websockify"]) {
            expect(computerProxyPathAllowed({ rest, can_manage_crew: false })).toBe(true);
        }
    });

    test("passes the shell to crew managers only", () => {
        expect(computerProxyPathAllowed({ rest: "terminal/", can_manage_crew: true })).toBe(true);
        expect(computerProxyPathAllowed({ rest: "terminal/ws", can_manage_crew: true })).toBe(true);
        expect(computerProxyPathAllowed({ rest: "terminal/", can_manage_crew: false })).toBe(false);
        expect(computerProxyPathAllowed({ rest: "terminal/ws", can_manage_crew: false })).toBe(false);
    });

    test("never passes the agent's API or the browser tools", () => {
        for (const rest of ["", "api/exec", "api/files/download", "mcp", "health", "desktop/../api/exec", "desktopx", "viewer/cdp"]) {
            expect(computerProxyPathAllowed({ rest, can_manage_crew: true })).toBe(false);
        }
    });
});
