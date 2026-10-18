import { describe, expect, test } from "bun:test";
import { crewStatusLine, crewStatusSentence } from "./crew-status";

const crew = [
    { kind: "coordinator", face: "working" },
    { kind: "worker", face: "needs-you" },
    { kind: "worker", face: "working" },
    { kind: "worker", face: "working" },
    { kind: "worker", face: "working" },
    { kind: "worker", face: "asleep" },
];

describe("crewStatusLine", () => {
    test("counts workers only", () => {
        expect(crewStatusLine({ bots: crew })).toBe("3 working · 1 needs you");
    });

    test("pluralises need", () => {
        expect(
            crewStatusLine({
                bots: [
                    { kind: "worker", face: "needs-you" },
                    { kind: "worker", face: "needs-you" },
                ],
            }),
        ).toBe("2 need you");
    });

    test("quiet crew", () => {
        expect(crewStatusLine({ bots: [{ kind: "worker", face: "done" }] })).toBe(
            "All quiet",
        );
    });
});

describe("crewStatusSentence", () => {
    test("the signature sentence", () => {
        expect(crewStatusSentence({ bots: crew })).toBe(
            "Three bots are working. One needs you.",
        );
    });

    test("single working bot", () => {
        expect(
            crewStatusSentence({ bots: [{ kind: "worker", face: "working" }] }),
        ).toBe("One bot is working.");
    });

    test("needs you without working bots names the bots", () => {
        expect(
            crewStatusSentence({
                bots: [
                    { kind: "worker", face: "needs-you" },
                    { kind: "worker", face: "needs-you" },
                ],
            }),
        ).toBe("Two bots need you.");
    });

    test("nothing to report", () => {
        expect(crewStatusSentence({ bots: [] })).toBe("Nothing needs you.");
    });
});
