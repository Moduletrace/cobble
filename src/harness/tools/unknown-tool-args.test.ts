import { describe, expect, test } from "bun:test";
import { z } from "zod";
import unknownToolArgs from "./unknown-tool-args";

describe("unknownToolArgs", () => {
    const schema = z
        .object({ workspace_id: z.number().int().optional(), name: z.string().optional() })
        .refine((args) => args.name !== undefined, "Give a name.");

    test("names keys the schema doesn't take, through a refine", () => {
        expect(unknownToolArgs({ schema, args: { id: 9, name: "x" } })).toEqual({
            unknown: ["id"],
            known: ["workspace_id", "name"],
        });
    });

    test("passes a call that only uses known keys", () => {
        expect(unknownToolArgs({ schema, args: { workspace_id: 9 } }).unknown).toEqual([]);
    });

    test("ignores tools without an object schema", () => {
        expect(unknownToolArgs({ schema: undefined, args: { id: 9 } }).unknown).toEqual([]);
    });
});
