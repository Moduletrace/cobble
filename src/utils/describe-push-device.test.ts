import { describe, expect, test } from "bun:test";
import describePushDevice from "./describe-push-device";

describe("describePushDevice", () => {
    test("names the browser and the device", () => {
        expect(
            describePushDevice({
                user_agent:
                    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
                platform: "Linux armv8l",
            }),
        ).toBe("Chrome on Android");
    });

    test("knows iOS browsers are WebKit but still Chrome", () => {
        expect(
            describePushDevice({
                user_agent:
                    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0.0.0 Mobile/15E148 Safari/604.1",
            }),
        ).toBe("Chrome on iPhone");
    });

    test("falls back to the browser, then the platform, then a generic device", () => {
        expect(describePushDevice({ user_agent: "curl/8.0" })).toBe(
            "A browser",
        );
        expect(
            describePushDevice({ user_agent: "something", platform: "linux" }),
        ).toBe("Linux");
    });
});
