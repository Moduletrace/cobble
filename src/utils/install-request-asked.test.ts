import { describe, expect, test } from "bun:test";
import installRequestAsked from "./install-request-asked";
import parseInstallPackages from "./parse-install-packages";

describe("installRequestAsked", () => {
    test("groups the names by manager, in the order asked", () => {
        expect(
            installRequestAsked({
                packages: [
                    { manager: "apt", name: "jq" },
                    { manager: "pip", name: "rich" },
                    { manager: "apt", name: "ripgrep" },
                ],
            }),
        ).toBe("apt: jq, ripgrep; pip: rich");
    });
});

describe("parseInstallPackages", () => {
    test("keeps only well-formed entries", () => {
        const text = JSON.stringify([
            { manager: "apt", name: "jq" },
            { manager: "npm", name: "@scope/tool" },
            { manager: "apt", name: "jq; rm -rf /" },
            { manager: "brew", name: "jq" },
            { manager: "pip", name: "https://evil/x.whl" },
            { manager: "pip", name: "-e." },
        ]);

        expect(parseInstallPackages({ text })).toEqual([
            { manager: "apt", name: "jq" },
            { manager: "npm", name: "@scope/tool" },
        ]);
    });

    test("nothing for anything that isn't a list", () => {
        for (const text of [null, "", "{}", "nope"]) expect(parseInstallPackages({ text })).toEqual([]);
    });
});
