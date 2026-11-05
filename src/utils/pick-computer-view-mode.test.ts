import { describe, expect, test } from "bun:test";
import computerViewModesFor from "./computer-view-modes-for";
import pickComputerViewMode from "./pick-computer-view-mode";

const crew = computerViewModesFor({ can_manage_crew: true });
const member = computerViewModesFor({ can_manage_crew: false });

describe("pickComputerViewMode", () => {
    test("opens where it was last viewed", () => {
        expect(pickComputerViewMode({ modes: crew, remembered: "terminal" })).toBe("terminal");
    });

    test("a mode asked for (a take-over) wins over the remembered one", () => {
        expect(pickComputerViewMode({ modes: crew, requested: "browser", remembered: "terminal" })).toBe("browser");
    });

    test("falls back to the first mode for a mode the user can't open or doesn't know", () => {
        expect(pickComputerViewMode({ modes: member, remembered: "terminal" })).toBe("browser");
        expect(pickComputerViewMode({ modes: crew, requested: "code", remembered: "nope" })).toBe("browser");
        expect(pickComputerViewMode({ modes: crew })).toBe("browser");
    });
});
