import { describe, expect, test } from "bun:test";
import binaryWriteProblem from "./binary-write-problem";

/**
 * A `.png` path and a truncated base64 string became a 2.6 KB "image" the
 * user could not open, while the reply said a 1376x768 PNG was attached.
 * `write_file` saves text: a binary extension is refused, with the tool that
 * makes the real file named.
 */
describe("writing a binary file as text", () => {
    test("an image is refused", () => {
        expect(binaryWriteProblem({ path: "images/summit-hero.png" })).toContain("binary file (.png)");
    });

    test("the refusal names a way to make it", () => {
        const problem = binaryWriteProblem({ path: "report.pdf" }) || "";

        expect(problem).toContain("generate_image");
        expect(problem).toContain("make_pdf");
        expect(problem).toContain("import_file");
    });

    test("an uppercase extension is refused too", () => {
        expect(binaryWriteProblem({ path: "SCREENSHOT.PNG" })).toContain(".png");
    });

    test("a zip, an office document and a font are refused", () => {
        for (const path of ["bundle.zip", "notes.docx", "font.woff2"]) {
            expect(binaryWriteProblem({ path })).toBeTruthy();
        }
    });

    test("text files pass", () => {
        for (const path of ["notes.md", "data.csv", "run.py", "page.svg", "README"]) {
            expect(binaryWriteProblem({ path })).toBeNull();
        }
    });
});