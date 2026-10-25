import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import handleInstallIconFile from "./handle-install-icon-file";

const previous_data_dir = process.env.DATA_DIR;
const data_dir = mkdtempSync(path.join(tmpdir(), "cobble-install-icon-"));

beforeAll(() => {
    process.env.DATA_DIR = data_dir;
    mkdirSync(path.join(data_dir, "install-icon/0123456789ab"), { recursive: true });
    writeFileSync(path.join(data_dir, "install-icon/0123456789ab/icon-192.png"), "png");
    writeFileSync(path.join(data_dir, "install-icon/source.png"), "source");
});

afterAll(() => {
    process.env.DATA_DIR = previous_data_dir;
    rmSync(data_dir, { recursive: true, force: true });
});

describe("handleInstallIconFile", () => {
    test("lets other paths through", async () => {
        expect(await handleInstallIconFile({ pathname: "/icons/icon-192.png" })).toBeNull();
    });

    test("serves a set's file, cached for good", async () => {
        const res = await handleInstallIconFile({ pathname: "/install-icon/0123456789ab/icon-192.png" });

        expect(res?.status).toBe(200);
        expect(res?.headers.get("content-type")).toBe("image/png");
        expect(res?.headers.get("cache-control")).toContain("immutable");
        expect(await res?.text()).toBe("png");
    });

    test("never serves the stored upload, unknown names or paths outside a set", async () => {
        for (const pathname of [
            "/install-icon/source.png",
            "/install-icon/0123456789ab/source.png",
            "/install-icon/0123456789ab/../source.png",
            "/install-icon/0123456789ab/maskable-192.png",
        ]) {
            expect((await handleInstallIconFile({ pathname }))?.status).toBe(404);
        }
    });
});
