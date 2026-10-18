import { describe, expect, test } from "bun:test";
import AppError from "./app-error";
import safeErrorMessage from "./safe-error-message";

describe("safeErrorMessage", () => {
    test("returns the message of an AppError", () => {
        expect(
            safeErrorMessage({ error: new AppError("Please try again") }),
        ).toBe("Please try again");
    });

    test("hides the message of a plain Error", () => {
        expect(
            safeErrorMessage({
                error: new Error("SQLITE_CONSTRAINT: users.email"),
            }),
        ).toBe("Something went wrong. Please try again.");
    });

    test("hides non-Error values", () => {
        expect(safeErrorMessage({ error: "boom" })).toBe(
            "Something went wrong. Please try again.",
        );
    });

    test("supports a custom fallback", () => {
        expect(
            safeErrorMessage({
                error: new Error("internal"),
                fallback: "Request failed",
            }),
        ).toBe("Request failed");
    });
});
