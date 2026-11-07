import { describe, expect, test } from "bun:test";
import { SupersededSnapshotNote } from "@/src/data/harness-prompts";
import type { HarnessMessage } from "../types";
import supersedeToolOutputs from "./supersede-tool-outputs";

const call = (id: string, name: string): HarnessMessage => ({
    role: "assistant",
    content: null,
    tool_calls: [{ id, name, arguments: "{}" }],
});

const result = (id: string, content: string): HarnessMessage => ({ role: "tool", tool_call_id: id, content });

describe("supersedeToolOutputs", () => {
    test("keeps only the newest snapshot of each browser", () => {
        const transcript: HarnessMessage[] = [
            { role: "user", content: "Check the site." },
            call("1", "browser_snapshot"),
            result("1", "page one"),
            call("2", "browser_click"),
            result("2", "clicked"),
            call("3", "pc__browser_snapshot"),
            result("3", "my page"),
            call("4", "browser_snapshot"),
            result("4", "page two"),
        ];

        expect(supersedeToolOutputs({ transcript })).toBe(1);
        expect(transcript[2]!.content).toBe(SupersededSnapshotNote);
        expect(transcript[4]!.content).toBe("clicked");
        expect(transcript[6]!.content).toBe("my page");
        expect(transcript[8]!.content).toBe("page two");
        expect(supersedeToolOutputs({ transcript })).toBe(0);
    });

    test("a failed snapshot replaces nothing", () => {
        const transcript: HarnessMessage[] = [
            call("1", "browser_snapshot"),
            result("1", "page one"),
            call("2", "browser_snapshot"),
            result("2", "Error: the browser is closed."),
        ];

        expect(supersedeToolOutputs({ transcript })).toBe(0);
        expect(transcript[1]!.content).toBe("page one");
    });
});
