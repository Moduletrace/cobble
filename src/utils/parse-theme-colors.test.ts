import { describe, expect, test } from "bun:test";
import parseThemeColors from "./parse-theme-colors";

describe("parseThemeColors", () => {
    test("extracts color tokens from the @theme inline block", () => {
        const css = `
@import "x.css";

@theme inline {
    --font-sans: "Geist";
    --color-primary: #101828;
    --color-slate-500: #667085;
    --color-accent:#5B5BD6;
    --radius-default: 6px;
}

.foo { --color-primary: #ff0000; }
`;

        expect(parseThemeColors({ css })).toEqual({
            primary: "#101828",
            "slate-500": "#667085",
            accent: "#5b5bd6",
        });
    });

    test("returns an empty object without a theme block", () => {
        expect(parseThemeColors({ css: ".a { color: red; }" })).toEqual({});
    });
});
