import { describe, expect, test } from "bun:test";
import computerViewModesFor from "./computer-view-modes-for";

describe("computerViewModesFor", () => {
    test("members get the browser only", () => {
        expect(computerViewModesFor({ can_manage_crew: false }).map((mode) => mode.value)).toEqual(["browser"]);
    });

    test("crew managers get the shell too, browser first", () => {
        expect(computerViewModesFor({ can_manage_crew: true }).map((mode) => mode.value)).toEqual(["browser", "terminal"]);
    });

    test("an SSH server has its terminal alone, for anyone", () => {
        expect(computerViewModesFor({ can_manage_crew: false, connection: "ssh" }).map((mode) => mode.value)).toEqual([
            "ssh_terminal",
        ]);
        expect(computerViewModesFor({ can_manage_crew: true, connection: "docker" }).map((mode) => mode.value)).toEqual([
            "browser",
            "terminal",
        ]);
    });
});
