import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";
import type { DecryptedEnv } from "./grab-all-envs";

let bot: { id: number; kind: string } | null = { id: 5, kind: "worker" };
let workspace_ids: number[] = [];
let envs: DecryptedEnv[] = [];
let saved: Record<string, unknown> | undefined;

mock.module("../bots/grab-user-bot", () => ({ default: async () => bot }));
mock.module("../workspaces/grab-bot-workspace-ids", () => ({ default: async () => workspace_ids }));
mock.module("./grab-all-envs", () => ({ default: async () => envs, clearEnvCache: () => {} }));
mock.module("./save-env", () => ({
    default: async (params: Record<string, unknown>) => {
        saved = params;
        return 99;
    },
}));

const { default: saveUserSecret } = await import("./save-user-secret");

afterAll(() => mock.restore());

beforeEach(() => {
    bot = { id: 5, kind: "worker" };
    workspace_ids = [];
    envs = [];
    saved = undefined;
});

const env = (over: Partial<DecryptedEnv>): DecryptedEnv => ({
    id: 1,
    key: "K",
    value: "v",
    description: "",
    paradigm: "general",
    workspace_id: null,
    computer_id: null,
    bot_id: null,
    user_id: null,
    secret: true,
    expose_to_computers: true,
    ...over,
});

const save = (key = "API_HOST", value = "x") => saveUserSecret({ user_id: 1, bot_id: 5, key, value });

describe("saveUserSecret wider-scope collision (H6)", () => {
    test("refuses a key a general env already holds", async () => {
        envs = [env({ paradigm: "general", key: "API_HOST" })];
        await expect(save()).rejects.toThrow("wider scope");
        expect(saved).toBeUndefined();
    });

    test("refuses a key this bot's own env already holds", async () => {
        envs = [env({ paradigm: "bot", bot_id: 5, key: "API_HOST" })];
        await expect(save()).rejects.toThrow("wider scope");
    });

    test("allows a key only another bot's env holds", async () => {
        envs = [env({ paradigm: "bot", bot_id: 6, key: "API_HOST" })];
        await expect(save()).resolves.toBe(99);
        expect(saved?.paradigm).toBe("user");
    });

    test("refuses a key a workspace env holds where the bot works", async () => {
        workspace_ids = [9];
        envs = [env({ paradigm: "workspace", workspace_id: 9, key: "API_HOST" })];
        await expect(save()).rejects.toThrow("wider scope");
    });

    test("allows a key a workspace env holds where the bot does not work", async () => {
        workspace_ids = [1];
        envs = [env({ paradigm: "workspace", workspace_id: 9, key: "API_HOST" })];
        await expect(save()).resolves.toBe(99);
    });

    test("the coordinator works everywhere, so any workspace env collides", async () => {
        bot = { id: 5, kind: "coordinator" };
        envs = [env({ paradigm: "workspace", workspace_id: 9, key: "API_HOST" })];
        await expect(save()).rejects.toThrow("wider scope");
    });

    test("the key is trimmed before the collision check", async () => {
        envs = [env({ paradigm: "general", key: "API_HOST" })];
        await expect(save(" API_HOST ")).rejects.toThrow("wider scope");
    });

    test("a fresh key is saved as a personal secret", async () => {
        await expect(save("MY_KEY")).resolves.toBe(99);
        expect(saved?.paradigm).toBe("user");
        expect(saved?.bot_id).toBe(5);
        expect(saved?.owner_user_id).toBe(1);
        expect(saved?.secret).toBe(true);
    });

    test("an existing personal secret for the same key is replaced, not collided", async () => {
        envs = [env({ paradigm: "user", bot_id: 5, user_id: 1, key: "MY_KEY", id: 77 })];
        await expect(save("MY_KEY")).resolves.toBe(99);
        expect(saved?.env_id).toBe(77);
    });

    test("a bot the user no longer reaches is refused", async () => {
        bot = null;
        await expect(save()).rejects.toThrow("no longer have this bot");
    });

    test("an empty value is refused", async () => {
        await expect(save("MY_KEY", "")).rejects.toThrow("Enter a value");
    });
});
