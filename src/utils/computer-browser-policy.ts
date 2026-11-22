import { ComputerBrowserExtensions } from "@/src/data/computer-browser-extensions";

/**
 * Where Chrome fetches Web Store extensions from.
 */
const WebStoreUpdateUrl = "https://clients2.google.com/service/update2/crx";

type Params = {
    extensions?: ReadonlyArray<{ id: string }>;
};

/**
 * The browser's own settings, kept out of the user's hands because a bot
 * works in it: no saved password (a login form Chrome filled in put its
 * value into page text, and a bot repeated it in a message; the agent also
 * deletes the stores at every start, `prune-profile-secrets`), no saving a
 * new one, no address or card autofill, and no Chrome account signed in
 * (that vault is where the filled-in password came from).
 */
const BrowserSettings = {
    PasswordManagerEnabled: false,
    AutofillCreditCardEnabled: false,
    AutofillAddressEnabled: false,
    BrowserSignin: 0,
    SyncDisabled: true,
};

/**
 * The managed policy file (`AppData.ComputerBrowserPolicyFile`) a
 * computer's Chrome reads: each extension (`ComputerBrowserExtensions` by
 * default) installed from the Web Store, which the user may turn off but
 * not remove, no tab ever discarded (`TabDiscardingExceptions`): an idle
 * computer's agent parks a bot's tab in the background, and a discarded one
 * would reload and lose where the bot was, and the browser settings above.
 * Always the same text for the same list, so a computer that already has it
 * is left alone.
 */
export default function computerBrowserPolicy({ extensions = ComputerBrowserExtensions }: Params = {}) {
    const settings = Object.fromEntries(
        extensions.map(({ id }) => [
            id,
            { installation_mode: "normal_installed", update_url: WebStoreUpdateUrl },
        ]),
    );

    return `${JSON.stringify(
        { ExtensionSettings: settings, TabDiscardingExceptions: ["*"], ...BrowserSettings },
        null,
        4,
    )}\n`;
}
