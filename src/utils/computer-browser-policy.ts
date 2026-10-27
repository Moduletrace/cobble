import { ComputerBrowserExtensions } from "@/src/data/computer-browser-extensions";

/**
 * Where Chrome fetches Web Store extensions from.
 */
const WebStoreUpdateUrl = "https://clients2.google.com/service/update2/crx";

type Params = {
    extensions?: ReadonlyArray<{ id: string }>;
};

/**
 * The managed policy file (`AppData.ComputerBrowserPolicyFile`) a
 * computer's Chrome reads: each extension (`ComputerBrowserExtensions` by
 * default) installed from the Web Store, which the user may turn off but
 * not remove. Always the same text for the same list, so a computer that
 * already has it is left alone.
 */
export default function computerBrowserPolicy({ extensions = ComputerBrowserExtensions }: Params = {}) {
    const settings = Object.fromEntries(
        extensions.map(({ id }) => [
            id,
            { installation_mode: "normal_installed", update_url: WebStoreUpdateUrl },
        ]),
    );

    return `${JSON.stringify({ ExtensionSettings: settings }, null, 4)}\n`;
}
