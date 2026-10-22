import { describe, expect, test } from "bun:test";
import type { PublicEnv } from "@/src/types";
import scopeValue, { envInScope } from "./scope-value";

const env = (fields: Partial<PublicEnv>): PublicEnv => ({
    id: 1,
    key: "K",
    description: "",
    paradigm: "general",
    workspace_id: null,
    computer_id: null,
    bot_id: null,
    secret: true,
    expose_to_computers: true,
    known: false,
    ...fields,
});

describe("scopeValue", () => {
    test("names each scope", () => {
        expect(scopeValue({ scope: { paradigm: "general", id: null } })).toBe("general");
        expect(scopeValue({ scope: { paradigm: "computer", id: 4 } })).toBe("computer:4");
        expect(scopeValue({ scope: { paradigm: "bot", id: 1 } })).toBe("bot:1");
    });
});

describe("envInScope", () => {
    test("matches the paradigm and its id", () => {
        const scope = { paradigm: "workspace" as const, id: 2, title: "" };

        expect(envInScope({ env: env({ paradigm: "workspace", workspace_id: 2 }), scope })).toBe(true);
        expect(envInScope({ env: env({ paradigm: "workspace", workspace_id: 3 }), scope })).toBe(false);
        expect(envInScope({ env: env({}), scope })).toBe(false);
    });

    test("matches a bot's own envs", () => {
        const scope = { paradigm: "bot" as const, id: 1, title: "" };

        expect(envInScope({ env: env({ paradigm: "bot", bot_id: 1 }), scope })).toBe(true);
        expect(envInScope({ env: env({ paradigm: "bot", bot_id: 2 }), scope })).toBe(false);
    });
});
