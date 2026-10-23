import { describe, expect, test } from "bun:test";
import clampPage from "./clamp-page";

describe("clampPage", () => {
    test("keeps a page that is inside the table", () => {
        expect(clampPage({ page: 2, total: 120, page_size: 50 })).toBe(2);
    });

    test("a page past the end lands on the last one", () => {
        expect(clampPage({ page: 99, total: 120, page_size: 50 })).toBe(3);
    });

    test("an empty table still has a first page", () => {
        expect(clampPage({ page: 4, total: 0, page_size: 50 })).toBe(1);
    });

    test("a page below one is the first", () => {
        expect(clampPage({ page: 0, total: 120, page_size: 50 })).toBe(1);
        expect(clampPage({ page: -3, total: 120, page_size: 50 })).toBe(1);
    });

    test("a table that fits exactly ends on the page asked for", () => {
        expect(clampPage({ page: 2, total: 100, page_size: 50 })).toBe(2);
        expect(clampPage({ page: 3, total: 100, page_size: 50 })).toBe(2);
    });

    test("a page size of nothing doesn't divide by zero", () => {
        expect(clampPage({ page: 1, total: 10, page_size: 0 })).toBe(1);
    });
});
