import { describe, expect, test } from "bun:test";
import parseTemplateLines, { templateLines } from "./parse-template-lines";

describe("parseTemplateLines", () => {
    test("reads headers, keeping colons in values", () => {
        expect(
            parseTemplateLines({ text: "Authorization: Bearer {{env.T}}\n\nX-Url: http://a:1\nbad line", separator: ":" }),
        ).toEqual({ Authorization: "Bearer {{env.T}}", "X-Url": "http://a:1" });
    });

    test("reads envs and writes them back", () => {
        const map = parseTemplateLines({ text: "A=1\nB = x=y", separator: "=" });
        expect(map).toEqual({ A: "1", B: "x=y" });
        expect(templateLines({ map, separator: "=" })).toBe("A=1\nB=x=y");
    });
});
