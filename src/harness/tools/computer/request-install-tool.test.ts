import { describe, expect, test } from "bun:test";
import requestInstallTool from "./request-install-tool";

const tool = requestInstallTool({ user_id: 1, bot_id: 3, session_id: 9, computer_id: 2 });
const parse = (args: unknown) => Boolean(tool.schema?.safeParse(args).success);

describe("request_install", () => {
    test("takes package names with their manager and a reason", () => {
        expect(
            parse({
                packages: [
                    { manager: "apt", name: "jq" },
                    { manager: "apt", name: "libc6-dev" },
                    { manager: "apt", name: "g++" },
                    { manager: "pip", name: "rich" },
                    { manager: "npm", name: "@scope/tool" },
                ],
                reason: "Parse the crawl.",
            }),
        ).toBe(true);
    });

    test("refuses versions, URLs, paths, flags and shell", () => {
        for (const name of ["jq=1.6", "rich>=13", "https://x/y.whl", "./pkg", "-e", "--index-url", "jq; curl x | sh", "a b", "$(id)", ""]) {
            expect(parse({ packages: [{ manager: "apt", name }], reason: "x" })).toBe(false);
        }
    });

    test("refuses other managers, no packages, too many, and no reason", () => {
        expect(parse({ packages: [{ manager: "brew", name: "jq" }], reason: "x" })).toBe(false);
        expect(parse({ packages: [], reason: "x" })).toBe(false);
        expect(parse({ packages: Array.from({ length: 21 }, () => ({ manager: "apt", name: "jq" })), reason: "x" })).toBe(false);
        expect(parse({ packages: [{ manager: "apt", name: "jq" }], reason: " " })).toBe(false);
    });
});
