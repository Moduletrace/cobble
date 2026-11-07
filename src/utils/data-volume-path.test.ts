import { describe, expect, test } from "bun:test";
import dataVolumePath from "./data-volume-path";

describe("dataVolumePath", () => {
    test("a file on the data volume reads from its root", () => {
        expect(dataVolumePath({ absolute: "/data/computers/2/bots/5/notes.md", data_dir: "/data" })).toBe(
            "computers/2/bots/5/notes.md",
        );
    });

    test("a file elsewhere keeps its absolute path", () => {
        expect(dataVolumePath({ absolute: "/srv/main/notes.md", data_dir: "/data" })).toBe("/srv/main/notes.md");
        expect(dataVolumePath({ absolute: "/database/cobble.db", data_dir: "/data" })).toBe("/database/cobble.db");
    });
});
