import { afterAll, describe, expect, test } from "bun:test";
import path from "path";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import buildPrecacheManifest from "./build-precache-manifest";

const root = mkdtempSync(path.join(tmpdir(), "precache-"));

afterAll(() => rmSync(root, { recursive: true, force: true }));

function writeBuild({ dir, files }: { dir: string; files: string[] }) {
    writeFileSync(
        path.join(dir, "build-info.json"),
        JSON.stringify({ build_id: "build-1" }),
    );

    for (const file of files) {
        const full_path = path.join(dir, "public", file);
        mkdirSync(path.dirname(full_path), { recursive: true });
        writeFileSync(full_path, "x");
    }
}

describe("buildPrecacheManifest", () => {
    test("lists every public file under its served path", () => {
        const dir = path.join(root, "full");
        mkdirSync(dir);
        writeBuild({
            dir,
            files: [
                "vendor/react.js",
                "pages/chunk-AEHOZS24.js",
                "pages/admin/bots/[bot_id]/VXCMP4GM.js",
                "pages/auth/login/X4TQCLSA.css",
            ],
        });

        expect(buildPrecacheManifest({ bunext_dir: dir })).toEqual({
            build_id: "build-1",
            files: [
                "/.bunext/public/pages/admin/bots/[bot_id]/VXCMP4GM.js",
                "/.bunext/public/pages/auth/login/X4TQCLSA.css",
                "/.bunext/public/pages/chunk-AEHOZS24.js",
                "/.bunext/public/vendor/react.js",
            ],
        });
    });

    test("is null without a build", () => {
        const dir = path.join(root, "empty");
        mkdirSync(dir);

        expect(buildPrecacheManifest({ bunext_dir: dir })).toBeNull();
    });
});
