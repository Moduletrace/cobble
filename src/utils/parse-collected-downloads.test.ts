import { describe, expect, test } from "bun:test";
import parseCollectedDownloads from "./parse-collected-downloads";

describe("parseCollectedDownloads", () => {
    test("reads moved files and ones still downloading", () => {
        const output = ["moved\treport.pdf\t/w/bots/1/users/2/downloads/report.pdf", "pending\tbig.zip", "noise", "moved\tx"].join("\n");

        expect(parseCollectedDownloads({ output })).toEqual({
            moved: [{ name: "report.pdf", path: "/w/bots/1/users/2/downloads/report.pdf" }],
            pending: ["big.zip"],
        });
    });

    test("nothing found reads as nothing", () => {
        expect(parseCollectedDownloads({ output: "" })).toEqual({ moved: [], pending: [] });
    });
});
