import { describe, expect, test } from "bun:test";
import type { ComputerViewMode } from "@/src/dict/computer-dict";
import computerViewUrl from "./computer-view-url";

describe("computerViewUrl", () => {
    test("serves the screen under the computer's address", () => {
        expect(computerViewUrl({ computer_id: 3, mode: "browser" })).toBe("/computers/3/desktop/");
    });

    test("serves the shell beside it", () => {
        expect(computerViewUrl({ computer_id: 3, mode: "terminal" })).toBe("/computers/3/terminal/");
    });

    test("opens the first mode for one the computer no longer has (an old take-over)", () => {
        expect(computerViewUrl({ computer_id: 3, mode: "code" as ComputerViewMode })).toBe("/computers/3/desktop/");
    });
});
