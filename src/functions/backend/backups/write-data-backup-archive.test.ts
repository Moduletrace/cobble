import { afterEach, describe, expect, test } from "bun:test";
import fs from "fs";
import os from "os";
import path from "path";
import writeDataBackupArchive from "./write-data-backup-archive";

const dirs: string[] = [];
const previous = {
    DATA_DIR: process.env.DATA_DIR,
    BACKUP_ARCHIVE_DIR: process.env.BACKUP_ARCHIVE_DIR,
};

function makeRoot() {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cobble-archive-"));

    dirs.push(dir);

    return dir;
}

function write({ root, relative, content = "x" }: { root: string; relative: string; content?: string }) {
    const target = path.join(root, relative);

    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
}

afterEach(() => {
    for (const dir of dirs.splice(0)) {
        fs.rmSync(dir, { recursive: true, force: true });
    }

    for (const [key, value] of Object.entries(previous)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
    }
});

describe("writeDataBackupArchive", () => {
    test("tars the install's data and leaves out what is rebuilt or kept elsewhere", async () => {
        const data_dir = makeRoot();
        const archive_dir = makeRoot();

        process.env.DATA_DIR = data_dir;
        process.env.BACKUP_ARCHIVE_DIR = archive_dir;

        write({ root: data_dir, relative: "db/cobble" });
        write({ root: data_dir, relative: "db/.backups/cobble-1" });
        write({ root: data_dir, relative: ".bun-sqlite/.tmp/temp.db" });
        write({ root: data_dir, relative: "computers/1/bots/3/users/1/work.txt" });
        write({ root: data_dir, relative: "computers/1/bots/3/users/1/node_modules/pkg/index.js" });
        write({ root: data_dir, relative: "computer-browsers/1/Default/Cookies" });
        write({ root: data_dir, relative: "computer-browsers/1/Default/Code Cache/js" });
        write({ root: data_dir, relative: "bots/1/report.md" });
        write({ root: data_dir, relative: "media/1/picture.png" });

        const created = await writeDataBackupArchive();
        const list = Bun.spawnSync(["tar", "-tzf", created.path]);
        const members = new TextDecoder().decode(list.stdout).split("\n").filter(Boolean);
        const root = created.name.replace(/\.tar\.gz$/, "");

        /**
         * Every member sits under one folder named after the archive, so
         * an extract lands one folder.
         */
        expect(members.every((member) => member.startsWith(`${root}/`))).toBe(true);

        for (const kept of [
            `${root}/db/cobble`,
            `${root}/bots/1/report.md`,
            `${root}/media/1/picture.png`,
            `${root}/computer-browsers/1/Default/Cookies`,
        ]) {
            expect(members).toContain(kept);
        }

        for (const left_out of [
            `${root}/computers`,
            `${root}/db/.backups`,
            `${root}/.bun-sqlite`,
            `${root}/computer-browsers/1/Default/Code Cache`,
        ]) {
            expect(members.some((member) => member == left_out || member.startsWith(`${left_out}/`))).toBe(false);
        }
    });

    test("keeps only the newest archives", async () => {
        const data_dir = makeRoot();
        const archive_dir = makeRoot();

        process.env.DATA_DIR = data_dir;
        process.env.BACKUP_ARCHIVE_DIR = archive_dir;

        write({ root: data_dir, relative: "db/cobble" });
        write({ root: archive_dir, relative: "cobble-data-1.tar.gz" });

        const created = await writeDataBackupArchive();

        expect(fs.existsSync(created.path)).toBe(true);
    });
});