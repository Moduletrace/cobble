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

    test("a lightweight browser turns the GPU off and drops the WebGL flags", () => {
        const args = browserArgs({ ...base, screen: { width: 1366, height: 768 }, scale: 1, lightweight: true });

        expect(args).toEqual(
            expect.arrayContaining([
                "--disable-gpu",
                "--force-prefers-reduced-motion",
                "--disable-smooth-scrolling",
                "--disable-component-update",
            ]),
        );
        expect(args).not.toContain("--ignore-gpu-blocklist");
        expect(args).not.toContain("--disable-gpu-compositing");
    });

    test("folds the user's --disable-features into the lightweight list", () => {
        const args = browserArgs({
            ...base,
            screen: { width: 1366, height: 768 },
            scale: 1,
            lightweight: true,
            extra: ["--disable-features=Foo,Translate", "--mute-audio"],
        });
        const features = args.filter((arg) => arg.startsWith("--disable-features="));

        expect(features).toHaveLength(1);
        expect(features[0]!.split("=")[1]!.split(",")).toEqual(expect.arrayContaining(["MediaRouter", "Translate", "Foo"]));
        expect(args).toContain("--mute-audio");
    });
});
