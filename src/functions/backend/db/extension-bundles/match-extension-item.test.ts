import { describe, expect, test } from "bun:test";
import matchExtensionItem, { type ExistingExtensionItem } from "./match-extension-item";

const existing: ExistingExtensionItem[] = [
    {
        id: 7,
        key: "github",
        config: { name: "GitHub", transport: "remote", url: "https://example.test/mcp", headers: { a: "b" } },
    },
    {
        id: 9,
        key: "weekly-seo-report",
        config: { name: "Weekly SEO report", body: "# Do it" },
    },
];

describe("matchExtensionItem", () => {
    test("an item with no row here is new", () => {
        expect(matchExtensionItem({ key: "linear", config: { name: "Linear" }, existing })).toEqual({
            status: "new",
            existing_id: null,
            differing: [],
        });
    });

    test("an identical config is the same row", () => {
        expect(
            matchExtensionItem({
                key: "github",
                config: { name: "GitHub", transport: "remote", url: "https://example.test/mcp", headers: { a: "b" } },
                existing,
            }),
        ).toEqual({ status: "same", existing_id: 7, differing: [] });
    });

    test("key order inside a config doesn't matter", () => {
        expect(
            matchExtensionItem({
                key: "github",
                config: { headers: { a: "b" }, url: "https://example.test/mcp", transport: "remote", name: "GitHub" },
                existing,
            }).status,
        ).toBe("same");
    });

    test("a changed config conflicts, naming the fields that differ", () => {
        const match = matchExtensionItem({
            key: "github",
            config: { name: "GitHub", transport: "remote", url: "https://other.test/mcp", headers: { a: "b" } },
            existing,
        });

        expect(match.status).toBe("conflict");
        expect(match.existing_id).toBe(7);
        expect(match.differing).toEqual(["url"]);
    });

    test("a field only one side has counts as differing", () => {
        expect(
            matchExtensionItem({ key: "weekly-seo-report", config: { name: "Weekly SEO report", body: "# Do it", enabled: false }, existing })
                .differing,
        ).toEqual(["enabled"]);
    });

    test("the fields a bundle never carries are ignored on both sides", () => {
        expect(
            matchExtensionItem({
                key: "github",
                config: {
                    name: "GitHub",
                    transport: "remote",
                    url: "https://example.test/mcp",
                    headers: { a: "b" },
                    all_bots: false,
                    mcp_server_id: 3,
                },
                existing,
            }).status,
        ).toBe("same");
    });

    test("nested arrays are compared by content, not by reference", () => {
        expect(
            matchExtensionItem({
                key: "github",
                config: {
                    name: "GitHub",
                    transport: "remote",
                    url: "https://example.test/mcp",
                    headers: { a: "b" },
                    excluded_tools: ["x", "y"],
                },
                existing: [
                    {
                        id: 7,
                        key: "github",
                        config: {
                            name: "GitHub",
                            transport: "remote",
                            url: "https://example.test/mcp",
                            headers: { a: "b" },
                            excluded_tools: ["x", "y"],
                        },
                    },
                ],
            }).status,
        ).toBe("same");
    });
});