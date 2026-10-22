import { describe, expect, test } from "bun:test";
import type { DecryptedEnv } from "./grab-all-envs";
import resolveScopedEnvs from "./resolve-scoped-envs";

let next_id = 1;

const env = (fields: Partial<DecryptedEnv> & { key: string; value: string }): DecryptedEnv => ({
    id: next_id++,
    description: "",
    paradigm: "general",
    workspace_id: null,
    computer_id: null,
    bot_id: null,
    secret: true,
    expose_to_computers: true,
    ...fields,
});

const values = (envs: DecryptedEnv[]) =>
    Object.fromEntries(envs.map((e) => [e.key, e.value]));

describe("resolveScopedEnvs", () => {
    test("computer beats workspace beats general", () => {
        const envs = [
            env({ key: "TOKEN", value: "general" }),
            env({ key: "TOKEN", value: "workspace", paradigm: "workspace", workspace_id: 2 }),
            env({ key: "TOKEN", value: "computer", paradigm: "computer", computer_id: 7 }),
            env({ key: "REGION", value: "eu", paradigm: "workspace", workspace_id: 2 }),
            env({ key: "ONLY_GENERAL", value: "yes" }),
        ];

        expect(values(resolveScopedEnvs({ envs, computer_id: 7, workspace_ids: [2] }))).toEqual({
            TOKEN: "computer",
            REGION: "eu",
            ONLY_GENERAL: "yes",
        });
    });

    test("ignores other computers and workspaces", () => {
        const envs = [
            env({ key: "TOKEN", value: "general" }),
            env({ key: "TOKEN", value: "other", paradigm: "computer", computer_id: 8 }),
            env({ key: "TOKEN", value: "elsewhere", paradigm: "workspace", workspace_id: 3 }),
        ];

        expect(values(resolveScopedEnvs({ envs, computer_id: 7, workspace_ids: [2] }))).toEqual({
            TOKEN: "general",
        });
    });

    test("the first workspace listed wins a tie", () => {
        const envs = [
            env({ key: "TOKEN", value: "first", paradigm: "workspace", workspace_id: 2 }),
            env({ key: "TOKEN", value: "second", paradigm: "workspace", workspace_id: 5 }),
        ];

        expect(values(resolveScopedEnvs({ envs, computer_id: 7, workspace_ids: [2, 5] }))).toEqual({
            TOKEN: "first",
        });
    });

    test("the bot's own env beats everything", () => {
        const envs = [
            env({ key: "TOKEN", value: "general" }),
            env({ key: "TOKEN", value: "workspace", paradigm: "workspace", workspace_id: 2 }),
            env({ key: "TOKEN", value: "computer", paradigm: "computer", computer_id: 7 }),
            env({ key: "TOKEN", value: "bot", paradigm: "bot", bot_id: 4 }),
            env({ key: "OTHER_BOT", value: "no", paradigm: "bot", bot_id: 5 }),
        ];

        expect(
            values(resolveScopedEnvs({ envs, bot_id: 4, computer_id: 7, workspace_ids: [2] })),
        ).toEqual({ TOKEN: "bot" });
    });

    test("leaves out unexposed envs and app settings", () => {
        const envs = [
            env({ key: "HIDDEN", value: "x", expose_to_computers: false }),
            env({ key: "OPENROUTER_API_KEY", value: "sk-or" }),
        ];

        expect(resolveScopedEnvs({ envs, computer_id: 7, workspace_ids: [] })).toEqual([]);
    });
});
