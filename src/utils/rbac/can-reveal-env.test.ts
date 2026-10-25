import { describe, expect, test } from "bun:test";
import canRevealEnv from "./can-reveal-env";

describe("canRevealEnv", () => {
    const personal = { paradigm: "user", user_id: 4 };
    const general = { paradigm: "general", user_id: null };

    test("a personal secret only to its own user, while they reach the bot", () => {
        expect(canRevealEnv({ env: personal, viewer_id: 4, role: "member", reaches_bot: true })).toBe(true);
        expect(canRevealEnv({ env: personal, viewer_id: 4, role: "member", reaches_bot: false })).toBe(false);
        expect(canRevealEnv({ env: personal, viewer_id: 1, role: "super_admin", reaches_bot: true })).toBe(false);
    });

    test("any other env only to a super admin", () => {
        expect(canRevealEnv({ env: general, viewer_id: 1, role: "super_admin", reaches_bot: true })).toBe(true);
        expect(canRevealEnv({ env: general, viewer_id: 2, role: "admin", reaches_bot: true })).toBe(false);
        expect(canRevealEnv({ env: { paradigm: "bot", user_id: null }, viewer_id: 3, role: "member", reaches_bot: true })).toBe(false);
    });
});
