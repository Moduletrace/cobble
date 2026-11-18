import { describe, expect, test } from "bun:test";
import sharedTextProblem from "./shared-text-guard";

const before = `# Workspace

Workspace for all Summit Lending projects.

## Products and services

Lending site, articles, calculators.

## Key tables for content work

articles, article_translations, categories.

## Timestamp conventions

All times are Unix seconds, UTC.

## Standing rules

Never publish without review.
`;

describe("sharedTextProblem", () => {
    test("lets a first fill through", () => {
        expect(sharedTextProblem({ before: null, after: "# Workspace\n\nAnything." })).toBeNull();
        expect(sharedTextProblem({ before: "", after: "# Workspace\n\nAnything." })).toBeNull();
    });

    test("lets a rewrite through when every section is kept", () => {
        expect(sharedTextProblem({ before, after: before.replace("Lending site", "Lending site and blog") })).toBeNull();
    });

    test("lets an identical save through", () => {
        expect(sharedTextProblem({ before, after: before })).toBeNull();
    });

    test("names the sections a rewrite dropped", () => {
        const problem = sharedTextProblem({
            before,
            after: "# Workspace\n\nWorkspace for all Summit Lending projects.\n\n## Products and services\n\nLending site.",
        });

        expect(problem).toContain("would drop 3 sections");
        expect(problem).toContain(`"Key tables for content work"`);
        expect(problem).toContain(`"Timestamp conventions"`);
        expect(problem).toContain(`"Standing rules"`);
        expect(problem).toContain("replace: true");
    });

    test("refuses a big cut even when every heading is kept", () => {
        const long = `# Workspace\n\n${"Endless prose. ".repeat(40)}\n\n## Rules\n\n${"More prose. ".repeat(40)}`;
        const cut = `# Workspace\n\nShort.\n\n## Rules\n\nShort.`;

        expect(sharedTextProblem({ before: long, after: cut })).toContain("would cut the text down");
    });

    test("leaves a short text alone", () => {
        expect(sharedTextProblem({ before: "Home fragrance.", after: "Fragrance." })).toBeNull();
    });

    test("lets a replacement through when it's meant", () => {
        expect(sharedTextProblem({ before, replace: true, after: "# Workspace\n\nNothing else." })).toBeNull();
    });

    test("does not read a heading inside code as a section", () => {
        expect(
            sharedTextProblem({
                before: "# Workspace\n\n```bash\n# a comment\n```\n",
                after: "# Workspace\n\nA new body.",
            }),
        ).toBeNull();
    });
});