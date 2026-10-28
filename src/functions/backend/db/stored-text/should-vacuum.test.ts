import { describe, expect, test } from "bun:test";
import { AppData } from "@/src/data/app-data";
import shouldVacuum from "./should-vacuum";

const page_size = 4096;
const min_pages = Math.ceil(AppData.DbVacuumMinFreeBytes / page_size);

describe("shouldVacuum", () => {
    test("vacuums when a large share of a big file is free", () => {
        expect(shouldVacuum({ page_count: min_pages * 2, freelist_count: min_pages, page_size })).toBe(true);
    });

    test("leaves a database with little free space alone", () => {
        expect(shouldVacuum({ page_count: min_pages * 100, freelist_count: min_pages, page_size })).toBe(false);
    });

    test("leaves a small database alone even when mostly free", () => {
        expect(shouldVacuum({ page_count: 20, freelist_count: 15, page_size })).toBe(false);
    });

    test("never vacuums on missing numbers", () => {
        expect(shouldVacuum({ page_count: 0, freelist_count: 0, page_size })).toBe(false);
    });
});
