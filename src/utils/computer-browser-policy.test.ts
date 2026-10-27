import { describe, expect, test } from "bun:test";
import { ComputerBrowserExtensions } from "@/src/data/computer-browser-extensions";
import computerBrowserPolicy from "./computer-browser-policy";

describe("computerBrowserPolicy", () => {
    test("installs every default extension from the Web Store, turned off but not removed", () => {
        const policy = JSON.parse(computerBrowserPolicy());

        for (const { id } of ComputerBrowserExtensions) {
            expect(policy.ExtensionSettings[id]).toEqual({
                installation_mode: "normal_installed",
                update_url: "https://clients2.google.com/service/update2/crx",
            });
        }
    });

    test("is the same text for the same list", () => {
        expect(computerBrowserPolicy()).toBe(computerBrowserPolicy());
    });

    test("an empty list installs nothing", () => {
        expect(JSON.parse(computerBrowserPolicy({ extensions: [] }))).toEqual({ ExtensionSettings: {} });
    });
});
