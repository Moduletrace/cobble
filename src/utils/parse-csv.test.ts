import { expect, test } from "bun:test";
import parseCsv from "./parse-csv";

test("parseCsv splits rows and cells", () => {
    expect(parseCsv({ text: "a,b\r\n1,2\n3,4\n" })).toEqual({
        rows: [
            ["a", "b"],
            ["1", "2"],
            ["3", "4"],
        ],
        truncated: false,
        columns: 2,
    });
});

test("parseCsv keeps quoted delimiters, line breaks and quotes", () => {
    const { rows } = parseCsv({ text: '﻿name,note\n"Smith, J","said ""hi""\nthen left"\n' });

    expect(rows).toEqual([
        ["name", "note"],
        ["Smith, J", 'said "hi"\nthen left'],
    ]);
});

test("parseCsv pads short rows and reads tabs", () => {
    const { rows, columns } = parseCsv({ text: "a\tb\tc\n1", delimiter: "\t" });

    expect(columns).toBe(3);
    expect(rows).toEqual([
        ["a", "b", "c"],
        ["1", "", ""],
    ]);
});

test("parseCsv stops at max_rows", () => {
    expect(parseCsv({ text: "h\n1\n2\n3\n", max_rows: 2 })).toEqual({
        rows: [["h"], ["1"]],
        truncated: true,
        columns: 1,
    });
    expect(parseCsv({ text: "h\n1\n", max_rows: 2 }).truncated).toBe(false);
    expect(parseCsv({ text: "" }).rows).toEqual([]);
});
