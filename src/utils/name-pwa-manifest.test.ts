import { describe, expect, test } from "bun:test";
import { SiteData } from "@/src/data/site-data";
import namePwaManifest from "./name-pwa-manifest";

const manifest = {
    name: SiteData["SiteName"],
    short_name: SiteData["SiteName"],
    start_url: "/admin/bots",
};

describe("namePwaManifest", () => {
    test("leaves an unnamed install's manifest alone", () => {
        expect(namePwaManifest({ manifest, install_name: "" })).toEqual(manifest);
        expect(namePwaManifest({ manifest, install_name: "   " })).toEqual(manifest);
        expect(namePwaManifest({ manifest })).toEqual(manifest);
    });

    test("labels the icon with the name and adds the site name to the full name", () => {
        expect(namePwaManifest({ manifest, install_name: " Acme " })).toEqual({
            ...manifest,
            name: `Acme - ${SiteData["SiteName"]}`,
            short_name: "Acme",
        });
    });

    test("doesn't repeat the site name when the name already has it", () => {
        const install_name = `Acme ${SiteData["SiteName"].toUpperCase()}`;

        expect(namePwaManifest({ manifest, install_name })).toMatchObject({
            name: install_name,
            short_name: install_name,
        });
    });
});
