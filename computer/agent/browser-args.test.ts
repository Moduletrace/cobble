import { describe, expect, test } from "bun:test";
import browserArgs from "./browser-args";

const base = {
    profile_dir: "/p",
    cdp_port: 9222,
    lang: "en-US",
    accept_lang: "en-US,en",
    sandbox: true,
};

describe("browserArgs", () => {
    test("fills the screen at 100% without a scale flag", () => {
        const args = browserArgs({ ...base, screen: { width: 1920, height: 1080 }, scale: 1 });

        expect(args).toContain("--window-size=1920,1080");
        expect(args.some((arg) => arg.startsWith("--force-device-scale-factor"))).toBe(false);
    });

    test("sizes the window in scaled units, so it still fits the screen", () => {
        expect(browserArgs({ ...base, screen: { width: 1920, height: 1080 }, scale: 1.25 })).toEqual(
            expect.arrayContaining(["--window-size=1536,864", "--force-device-scale-factor=1.25"]),
        );
        expect(browserArgs({ ...base, screen: { width: 1366, height: 768 }, scale: 1.25 })).toContain("--window-size=1092,614");
    });

    test("keeps WebGL but composites in software", () => {
        const args = browserArgs({ ...base, screen: { width: 1920, height: 1080 }, scale: 1 });

        expect(args).toEqual(expect.arrayContaining(["--ignore-gpu-blocklist", "--disable-gpu-compositing"]));
    });
});
