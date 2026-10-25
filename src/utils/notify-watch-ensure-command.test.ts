import { describe, expect, test } from "bun:test";
import notifyWatchEnsureCommand from "./notify-watch-ensure-command";

/**
 * The command runs through the sandbox's shell as a Python heredoc, so the
 * placeholders must all be filled and the heredoc must close.
 */
describe("notifyWatchEnsureCommand", () => {
    test("fills the version and restart flag everywhere", () => {
        const command = notifyWatchEnsureCommand({ version: "7", restart_browser: false });

        expect(command).not.toContain("__VERSION__");
        expect(command).not.toContain("__RESTART__");
        expect(command.match(/== "7"|!= "7"/g)?.length).toBe(2);
        expect(command).toContain("elif False:");
        expect(notifyWatchEnsureCommand({ version: "7", restart_browser: true })).toContain("elif True:");
    });

    test("is one quoted heredoc", () => {
        const command = notifyWatchEnsureCommand({ version: "1", restart_browser: true });

        expect(command.startsWith("python3 - <<'COBBLE_NOTIFY_WATCH'\n")).toBe(true);
        expect(command.endsWith("\nCOBBLE_NOTIFY_WATCH")).toBe(true);
    });
});
