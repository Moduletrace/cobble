import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { BUN_SQLITE_COBBLE_MEDIA } from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import copyMediaAsPicture, { PictureParadigms } from "./copy-media-as-picture";

/**
 * A data directory of its own, with one PNG in it, so a copy reads real
 * bytes and the source can be checked to survive.
 */
let data_dir = "";
const source_path = "media/1/9.png";
const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
);

beforeAll(() => {
    data_dir = mkdtempSync(path.join(tmpdir(), "cobble-picture-"));
    process.env.DATA_DIR = data_dir;

    mkdirSync(path.dirname(path.join(data_dir, source_path)), { recursive: true });
    writeFileSync(path.join(data_dir, source_path), png);
});

afterAll(() => {
    delete process.env.DATA_DIR;
    rmSync(data_dir, { recursive: true, force: true });
});

const media = (overrides: Partial<BUN_SQLITE_COBBLE_MEDIA> = {}) =>
    ({
        id: 9,
        title: "logo.png",
        media_type: "image",
        mime_type: "image/png",
        media_write_path: source_path,
        ...overrides,
    }) as BUN_SQLITE_COBBLE_MEDIA;

type SaveParams = Parameters<NonNullable<Parameters<typeof copyMediaAsPicture>[0]["save"]>>[0];

/**
 * A `save` that records what it was given and answers a new row, so the
 * copy is checked without touching sharp.
 */
function recorder() {
    const calls: SaveParams[] = [];

    return {
        calls,
        save: async (params: SaveParams) => {
            calls.push(params);
            return { id: 77, ...params } as BUN_SQLITE_COBBLE_MEDIA;
        },
    };
}

describe("copyMediaAsPicture", () => {
    test("names the paradigm the picture is saved under", () => {
        expect(PictureParadigms.bot).toBe("bot-image");
        expect(PictureParadigms.workspace).toBe("workspace-image");
    });

    test("saves a workspace picture under its own paradigm and answers the new id", async () => {
        const saved = recorder();

        const id = await copyMediaAsPicture({
            media: media(),
            user_id: 3,
            target: "workspace",
            title: "Summit Lending picture",
            save: saved.save,
        });

        expect(id).toBe(77);
        expect(saved.calls[0]?.paradigms).toEqual(["workspace-image"]);
        expect(saved.calls[0]?.title).toBe("Summit Lending picture");
        expect(saved.calls[0]?.user_id).toBe(3);
    });

    test("takes the image's own format, so a PNG is copied as a PNG", async () => {
        const saved = recorder();

        await copyMediaAsPicture({ media: media(), user_id: 3, target: "bot", save: saved.save });

        expect(saved.calls[0]?.ext).toBe("png");
    });

    test("copies the source's bytes without taking them away", async () => {
        const saved = recorder();

        await copyMediaAsPicture({ media: media(), user_id: 3, target: "workspace", save: saved.save });

        expect(Buffer.from(saved.calls[0]!.data).equals(png)).toBe(true);
        expect(await Bun.file(path.join(data_dir, source_path)).exists()).toBe(true);
    });

    test("refuses anything that isn't an image, and says how to get one", async () => {
        const saved = recorder();

        await expect(
            copyMediaAsPicture({
                media: media({ media_type: "document", mime_type: "image/svg+xml" }),
                user_id: 3,
                target: "workspace",
                save: saved.save,
            }),
        ).rejects.toThrow(/turned into a PNG first/);

        expect(saved.calls).toHaveLength(0);
    });

    test("refuses a file over the picture size limit", async () => {
        const saved = recorder();
        const big_path = "media/1/big.png";

        mkdirSync(path.dirname(path.join(data_dir, big_path)), { recursive: true });
        writeFileSync(path.join(data_dir, big_path), Buffer.alloc(AppData.ProfileImageMaxBytes + 1));

        await expect(
            copyMediaAsPicture({
                media: media({ media_write_path: big_path }),
                user_id: 3,
                target: "workspace",
                save: saved.save,
            }),
        ).rejects.toThrow(/too big/);

        expect(saved.calls).toHaveLength(0);
    });

    test("refuses a row whose file is gone", async () => {
        const saved = recorder();

        await expect(
            copyMediaAsPicture({
                media: media({ media_write_path: "media/1/missing.png" }),
                user_id: 3,
                target: "workspace",
                save: saved.save,
            }),
        ).rejects.toThrow(/missing on the server/);
    });

    test("refuses a row that is gone", async () => {
        const saved = recorder();

        await expect(
            copyMediaAsPicture({ media: media({ id: 0 }), user_id: 3, target: "bot", save: saved.save }),
        ).rejects.toThrow(/gone/);
    });
});
