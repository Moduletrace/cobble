import { describe, expect, test } from "bun:test";
import { z } from "zod";
import AppError from "./app-error";
import parseWithSchema from "./parse-with-schema";

const Schema = z.object({
    email: z.email("Please enter a valid email address"),
    age: z.number().min(18, "You must be at least 18"),
});

describe("parseWithSchema", () => {
    test("returns the parsed data for valid input", () => {
        expect(
            parseWithSchema({
                schema: Schema,
                data: { email: "person@example.com", age: 30 },
            }),
        ).toEqual({ email: "person@example.com", age: 30 });
    });

    test("throws an AppError with the first issue message", () => {
        expect(() =>
            parseWithSchema({
                schema: Schema,
                data: { email: "not-an-email", age: 30 },
            }),
        ).toThrow(AppError);
    });

    test("throws for non-object input", () => {
        expect(() =>
            parseWithSchema({ schema: Schema, data: null }),
        ).toThrow(AppError);
    });
});
