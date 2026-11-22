import { describe, expect, test } from "bun:test";
import { UpdateWorkspaceBotRequestSchema } from "./workspace-schema";

describe("UpdateWorkspaceBotRequestSchema", () => {
    test("leaves the fields it wasn't given alone", () => {
        const parsed = UpdateWorkspaceBotRequestSchema.parse({ workspace_id: "2", bot_id: "5", memory: "Short here." });

        expect(parsed).toEqual({ workspace_id: 2, bot_id: 5, memory: "Short here." });
        expect("system_prompt" in parsed).toBe(false);
    });
});
