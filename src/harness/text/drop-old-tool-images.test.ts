import { describe, expect, test } from "bun:test";
import { DroppedToolImageNote } from "@/src/data/harness-prompts";
import imageReadingKey from "../media/image-reading-key";
import type { HarnessMessage } from "../types";
import dropOldToolImages from "./drop-old-tool-images";

const shot = (n: number) => ({
    type: "image" as const,
    url: `data:image/png;base64,${n}`,
    focus: "the screen",
    from_tool: true,
});

describe("dropOldToolImages", () => {
    test("keeps the newest tool images and the user's own", () => {
        const attached = { type: "image" as const, url: "data:image/png;base64,user" };
        const transcript: HarnessMessage[] = [
            { role: "user", content: [{ type: "text", text: "Look:" }, attached] },
            { role: "user", content: [shot(1)] },
            { role: "user", content: [shot(2), shot(3)] },
            { role: "user", content: [shot(4)] },
        ];
        const cache = new Map([
            [imageReadingKey({ url: shot(1).url, focus: "the screen" }), "[Image: A login page.]"],
        ]);

        expect(dropOldToolImages({ transcript, keep: 2, cache })).toBe(2);
        expect(transcript).toEqual([
            { role: "user", content: [{ type: "text", text: "Look:" }, attached] },
            { role: "user", content: [{ type: "text", text: "[Image: A login page.]" }] },
            { role: "user", content: [{ type: "text", text: DroppedToolImageNote }, shot(3)] },
            { role: "user", content: [shot(4)] },
        ]);
        expect(dropOldToolImages({ transcript, keep: 2, cache })).toBe(0);
    });
});
