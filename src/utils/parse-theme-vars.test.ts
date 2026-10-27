import { describe, expect, test } from "bun:test";
import fs from "fs";
import path from "path";
import parseThemeVars from "./parse-theme-vars";

describe("parseThemeVars", () => {
    test("reads both schemes and the fonts", () => {
        const css = `:root {\n    --c-paper: #fff;\n    --m-fast: 1ms;\n}\n\n.dark {\n    --c-paper: #000;\n}\n\n@theme inline {\n    --font-sans:\n        "A", sans-serif;\n    --color-ink: var(--c-ink);\n}\n`;

        expect(parseThemeVars({ css })).toEqual({
            light: { "--c-paper": "#fff" },
            dark: { "--c-paper": "#000" },
            fonts: { "--font-sans": `"A", sans-serif` },
        });
    });

    test("finds the app's own tokens", () => {
        const css = fs.readFileSync(path.join(process.cwd(), "src/styles/main.css"), "utf-8");
        const vars = parseThemeVars({ css });

        for (const name of ["--c-paper", "--c-ink", "--c-border"]) {
            expect(vars.light[name]).toBeTruthy();
            expect(vars.dark[name]).toBeTruthy();
            expect(vars.light[name]).not.toBe(vars.dark[name]);
        }

        expect(vars.fonts["--font-sans"]).toBeTruthy();
    });
});
