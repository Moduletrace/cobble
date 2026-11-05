import { describe, expect, test } from "bun:test";
import computerViewModesFor from "./computer-view-modes-for";

describe("computerViewModesFor", () => {
    test("members get the browser only", () => {
        expect(computerViewModesFor({ can_manage_crew: false }).map((mode) => mode.value)).toEqual(["browser"]);
    });

    test("crew managers get the shell too, browser first", () => {
        expect(computerViewModesFor({ can_manage_crew: true }).map((mode) => mode.value)).toEqual(["browser", "terminal"]);
    });
});
