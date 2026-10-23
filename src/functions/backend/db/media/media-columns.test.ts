import { describe, expect, test } from "bun:test";
import schema from "@/db/schema";
import mediaColumns from "./media-columns";

/**
 * The schema's own list, so a column added later can't quietly be left
 * out of (or forgotten in) the select this guards.
 */
function mediaSchemaFields(): string[] {
    const tables = (schema as { tables?: { tableName: string; fields: { fieldName: string }[] }[] }).tables || [];
    const media = tables.find((table) => table.tableName == "media");

    /**
     * `id`, `created_at` and `updated_at` are added to every table by the
     * ORM, so they aren't in the schema's own field list.
     */
    return [...(media?.fields || []).map((field) => field.fieldName), "id", "created_at", "updated_at"];
}

describe("mediaColumns", () => {
    test("names every media column except the extracted text", () => {
        const listed = mediaColumns({ alias: "m" })
            .split(", ")
            .map((column) => column.replace(/^m\./, ""))
            .sort();

        const expected = mediaSchemaFields()
            .filter((field) => field != "text_content")
            .sort();

        expect(listed).toEqual(expected);
    });

    test("never selects text_content unless asked", () => {
        expect(mediaColumns()).not.toContain("text_content");
        expect(mediaColumns({ with_text_content: true })).toContain("m.text_content");
    });

    test("asking for the text adds it to the same full list", () => {
        const with_text = mediaColumns({ with_text_content: true });

        expect(with_text).toContain(mediaColumns());
        expect(with_text.split(", ")).toHaveLength(mediaColumns().split(", ").length + 1);
    });

    test("qualifies every column, so a join can't make one ambiguous", () => {
        for (const column of mediaColumns({ alias: "media" }).split(", ")) {
            expect(column.startsWith("media.")).toBe(true);
        }
    });

    test("the alias defaults to m", () => {
        expect(mediaColumns().startsWith("m.id")).toBe(true);
    });
});
