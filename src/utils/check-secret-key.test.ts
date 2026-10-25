import { describe, expect, test } from "bun:test";
import checkSecretKey from "./check-secret-key";

describe("checkSecretKey", () => {
    test("keeps a shell variable name, trimmed", () => {
        expect(checkSecretKey({ key: " GITHUB_TOKEN " })).toBe("GITHUB_TOKEN");
    });

    test("refuses names a shell can't take", () => {
        expect(() => checkSecretKey({ key: "1TOKEN" })).toThrow();
        expect(() => checkSecretKey({ key: "MY-TOKEN" })).toThrow();
        expect(() => checkSecretKey({ key: "" })).toThrow();
    });

    test("refuses the app's own settings and process-only keys", () => {
        expect(() => checkSecretKey({ key: "ENCRYPTION_KEY" })).toThrow();
        expect(() => checkSecretKey({ key: "VAPID_PRIVATE_KEY" })).toThrow();
    });
});
