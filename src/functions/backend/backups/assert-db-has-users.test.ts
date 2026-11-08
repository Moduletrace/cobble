import { afterAll, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import fs from "fs";
import os from "os";
import path from "path";
import assertDbHasUsers from "./assert-db-has-users";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cobble-bootstrap-db-"));

type Params = {
    name: string;
    sql: string;
};

function makeDb({ name, sql }: Params) {
    const db_path = path.join(dir, name);
    const db = new Database(db_path, { create: true });
    db.run(sql);
    db.close();
    return db_path;
}

afterAll(() => {
    fs.rmSync(dir, { recursive: true, force: true });
});

describe("assertDbHasUsers", () => {
    test("passes a database with an account", () => {
        const db_path = makeDb({
            name: "with-user.db",
            sql: `CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT); INSERT INTO users (email) VALUES ('a@b.c');`,
        });

        expect(() => assertDbHasUsers({ db_path })).not.toThrow();
    });

    test("refuses a database with no accounts", () => {
        const db_path = makeDb({
            name: "empty-users.db",
            sql: `CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT);`,
        });

        expect(() => assertDbHasUsers({ db_path })).toThrow(/no accounts/);
    });

    test("refuses a database without a users table", () => {
        const db_path = makeDb({
            name: "other.db",
            sql: `CREATE TABLE notes (id INTEGER PRIMARY KEY);`,
        });

        expect(() => assertDbHasUsers({ db_path })).toThrow(/no users table/);
    });

    test("leaves the file unchanged", () => {
        const db_path = makeDb({
            name: "unchanged.db",
            sql: `CREATE TABLE users (id INTEGER PRIMARY KEY); INSERT INTO users DEFAULT VALUES;`,
        });
        const before = fs.readFileSync(db_path);

        assertDbHasUsers({ db_path });

        expect(fs.readFileSync(db_path).equals(before)).toBe(true);
    });
});
