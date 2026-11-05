import { existsSync } from "node:fs";

/**
 * Google Chrome where it exists (amd64), else Debian's Chromium (arm64).
 */
export const BrowserBinaries = ["/usr/bin/google-chrome-stable", "/usr/bin/chromium"];

export default function findBrowserBinary() {
    const found = BrowserBinaries.find((binary) => existsSync(binary));

    if (!found) throw new Error(`No browser installed (looked for ${BrowserBinaries.join(", ")}).`);

    return found;
}
