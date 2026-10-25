import { describe, expect, test } from "bun:test";
import mediaFilePath from "./media-file-path";

const data_dir = "/data";
const db_dir = "/data/db";

describe("mediaFilePath", () => {
    test("resolves a path inside the data directory", () => {
        expect(mediaFilePath({ write_path: "media/3/a.png", data_dir, db_dir })).toBe("/data/media/3/a.png");
        expect(mediaFilePath({ write_path: "bots/2/report.md", data_dir, db_dir })).toBe("/data/bots/2/report.md");
    });

    test("refuses a path that climbs out of the data directory", () => {
        expect(mediaFilePath({ write_path: "../app/.env", data_dir, db_dir })).toBeNull();
        expect(mediaFilePath({ write_path: "media/../../etc/passwd", data_dir, db_dir })).toBeNull();
    });

    test("refuses an absolute path", () => {
        expect(mediaFilePath({ write_path: "/app/.env", data_dir, db_dir })).toBeNull();
    });

    test("refuses the database folder", () => {
        expect(mediaFilePath({ write_path: "db/cobble.db", data_dir, db_dir })).toBeNull();
        expect(mediaFilePath({ write_path: "media/../db/cobble.db", data_dir, db_dir })).toBeNull();
    });

    test("refuses empty paths, the root itself and NUL bytes", () => {
        expect(mediaFilePath({ write_path: "", data_dir, db_dir })).toBeNull();
        expect(mediaFilePath({ write_path: ".", data_dir, db_dir })).toBeNull();
        expect(mediaFilePath({ write_path: "media/a\0.png", data_dir, db_dir })).toBeNull();
    });
});
