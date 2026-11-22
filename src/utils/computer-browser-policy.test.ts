import { describe, expect, test } from "bun:test";
import computerBrowserPolicy from "./computer-browser-policy";

const extensions = [{ id: "hlkenndednhfkekhgcdicdfddnkalmdm" }, { id: "cjpalhdlnbpafiamejdnhcphjbkeiagm" }];

describe("computerBrowserPolicy", () => {
    test("installs every extension from the Web Store, turned off but not removed", () => {
        const policy = JSON.parse(computerBrowserPolicy({ extensions }));

        for (const { id } of extensions) {
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
        expect(JSON.parse(computerBrowserPolicy({ extensions: [] })).ExtensionSettings).toEqual({});
    });

    test("never lets Chrome discard a tab", () => {
        expect(JSON.parse(computerBrowserPolicy()).TabDiscardingExceptions).toEqual(["*"]);
    });

    test("keeps the browser's passwords and accounts away from a bot", () => {
        const policy = JSON.parse(computerBrowserPolicy());

        expect(policy.PasswordManagerEnabled).toBe(false);
        expect(policy.BrowserSignin).toBe(0);
        expect(policy.SyncDisabled).toBe(true);
        expect(policy.AutofillCreditCardEnabled).toBe(false);
        expect(policy.AutofillAddressEnabled).toBe(false);
    });
});
