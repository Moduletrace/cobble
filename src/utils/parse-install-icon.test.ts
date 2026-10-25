import { describe, expect, test } from "bun:test";
import { PwaDefaultInstallIcon } from "@/src/data/pwa-data";
import parseInstallIcon from "./parse-install-icon";

describe("parseInstallIcon", () => {
    test("falls back to the stock icon when nothing or junk is saved", () => {
        expect(parseInstallIcon({})).toEqual(PwaDefaultInstallIcon);
        expect(parseInstallIcon({ saved: "not json" })).toEqual(PwaDefaultInstallIcon);
        expect(parseInstallIcon({ saved: "[1]" })).toEqual(PwaDefaultInstallIcon);
    });

    test("reads a saved icon", () => {
        expect(
            parseInstallIcon({
                saved: JSON.stringify({ mode: "image", stone: "cobalt", mark: false, version: "0123456789ab" }),
            }),
        ).toEqual({ mode: "image", stone: "cobalt", mark: false, version: "0123456789ab" });
    });

    test("drops unknown values field by field", () => {
        expect(
            parseInstallIcon({
                saved: JSON.stringify({ mode: "video", stone: "plaid", mark: "yes", version: "../etc" }),
            }),
        ).toEqual(PwaDefaultInstallIcon);
    });
});
