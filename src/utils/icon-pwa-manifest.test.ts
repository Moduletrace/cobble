import { describe, expect, test } from "bun:test";
import iconPwaManifest from "./icon-pwa-manifest";

const manifest = {
    name: "cobble",
    icons: [
        { src: "/icons/icon-192.png", sizes: "192x192" },
        { src: "/icons/maskable-512.png", sizes: "512x512", purpose: "maskable" },
        { src: "https://example.com/other.png" },
    ],
    shortcuts: [{ name: "Help", url: "/admin/help", icons: [{ src: "/icons/icon-192.png" }] }],
};

describe("iconPwaManifest", () => {
    test("leaves the stock icons alone", () => {
        expect(iconPwaManifest({ manifest, icon_base: null })).toEqual(manifest);
    });

    test("moves every /icons/ file to the install's set", () => {
        const named = iconPwaManifest({ manifest, icon_base: "/install-icon/0123456789ab" });

        expect(named.icons).toEqual([
            { src: "/install-icon/0123456789ab/icon-192.png", sizes: "192x192" },
            { src: "/install-icon/0123456789ab/maskable-512.png", sizes: "512x512", purpose: "maskable" },
            { src: "https://example.com/other.png" },
        ]);
        expect(named.shortcuts).toEqual([
            { name: "Help", url: "/admin/help", icons: [{ src: "/install-icon/0123456789ab/icon-192.png" }] },
        ]);
    });
});
