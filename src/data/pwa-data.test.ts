import { describe, expect, test } from "bun:test";
import path from "path";
import { SiteData } from "./site-data";
import {
    PwaIcons,
    PwaManifestName,
    PwaOfflinePath,
    PwaScope,
    PwaStartPath,
} from "./pwa-data";

const ROOT = path.resolve(import.meta.dir, "../..");

describe("PwaData", () => {
    test("has the sizes a browser needs to install", () => {
        const any_sizes = PwaIcons.filter((icon) => icon.purpose == "any").map(
            (icon) => icon.sizes,
        );
        const maskable_sizes = PwaIcons.filter(
            (icon) => icon.purpose == "maskable",
        ).map((icon) => icon.sizes);

        expect(any_sizes).toContain("192x192");
        expect(any_sizes).toContain("512x512");
        expect(maskable_sizes).toContain("192x192");
        expect(maskable_sizes).toContain("512x512");
    });

    test("names the app from SiteData and starts on the crew", () => {
        expect(PwaManifestName).toBe(SiteData["SiteName"]);
        expect(PwaStartPath).toBe("/admin/bots");
        expect(PwaScope).toBe("/");
    });

    test("the generated manifest matches this config", async () => {
        const manifest = (await Bun.file(
            path.join(ROOT, "public/manifest.webmanifest"),
        ).json()) as {
            name: string;
            start_url: string;
            scope: string;
            icons: { src: string; purpose: string }[];
        };

        expect(manifest.name).toBe(PwaManifestName);
        expect(manifest.start_url).toBe(PwaStartPath);
        expect(manifest.scope).toBe(PwaScope);
        expect(
            manifest.icons.map((icon) => `${icon.src}:${icon.purpose}`),
        ).toEqual(PwaIcons.map((icon) => `${icon.src}:${icon.purpose}`));
    });

    test("the offline page and every icon exist", async () => {
        expect(
            await Bun.file(path.join(ROOT, "public", PwaOfflinePath)).exists(),
        ).toBe(true);

        for (const icon of PwaIcons) {
            const file = Bun.file(path.join(ROOT, "public", icon.src));
            expect(await file.exists()).toBe(true);
        }
    });
});
