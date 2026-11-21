import { describe, expect, test } from "bun:test";
import readExtensionPaste from "./read-extension-paste";

const mcp = {
    kind: "mcp",
    key: "GitHub",
    config: {
        name: "GitHub",
        description: "Issues and pull requests",
        transport: "remote",
        url: "https://mcp.example.com/mcp",
        headers: { Authorization: "Bearer {{env.GITHUB_TOKEN}}" },
        auth_scheme: "bearer",
        enabled: true,
        all_bots: false,
    },
};

const skill = {
    kind: "skill",
    key: "weekly-seo-report",
    config: {
        name: "Weekly SEO report",
        slug: "weekly-seo-report",
        description: "Use for the Monday search report.",
        body: "# Steps\n\n1. Open the dashboard.",
        enabled: true,
        all_bots: false,
    },
};

describe("readExtensionPaste", () => {
    test("takes the wanted kind out of a whole export and says how many follow it", () => {
        const result = readExtensionPaste({
            kind: "mcp",
            text: JSON.stringify({
                format: "cobble-extensions",
                version: 1,
                items: [mcp, { ...mcp, key: "GitLab" }, skill],
            }),
        });

        expect(result.ok).toBe(true);
        if (!result.ok) return;

        expect(result.paste.kind).toBe("mcp");
        expect(result.paste.config.name).toBe("GitHub");
        expect(result.paste.left).toBe(1);
    });

    test("takes one item on its own", () => {
        const result = readExtensionPaste({ kind: "skill", text: JSON.stringify(skill) });

        expect(result.ok).toBe(true);
        if (!result.ok || result.paste.kind != "skill") return;

        expect(result.paste.kind).toBe("skill");
        expect(result.paste.config.slug).toBe("weekly-seo-report");
        expect(result.paste.left).toBe(0);
    });

    test("takes the configuration a save takes, without the item around it", () => {
        const result = readExtensionPaste({ kind: "mcp", text: JSON.stringify(mcp.config) });

        expect(result.ok).toBe(true);
        if (!result.ok || result.paste.kind != "mcp") return;

        expect(result.paste.key).toBe("GitHub");
        expect(result.paste.config.transport).toBe("remote");
    });

    test("reads a tool's arguments from the JSON text of the object", () => {
        const result = readExtensionPaste({
            kind: "tool",
            text: JSON.stringify({
                name: "search",
                description: "Searches things.",
                kind: "http",
                parameters: '{"type":"object","properties":{"topic":{"type":"string"}}}',
                config: { method: "GET", url: "https://example.com/search" },
            }),
        });

        expect(result.ok).toBe(true);
        if (!result.ok || result.paste.kind != "tool") return;

        expect(result.paste.config.parameters).toEqual({ type: "object", properties: { topic: { type: "string" } } });
    });

    test("carries a knowledgebase's documents", () => {
        const result = readExtensionPaste({
            kind: "knowledgebase",
            text: JSON.stringify({
                kind: "knowledgebase",
                key: "Product handbook",
                config: { name: "Product handbook", description: "Pricing", enabled: true, all_bots: false },
                documents: [{ name: "Plans", mime_type: "text/markdown", text: "# Plans" }],
            }),
        });

        expect(result.ok).toBe(true);
        if (!result.ok || result.paste.kind != "knowledgebase") return;

        expect(result.paste.item.documents).toHaveLength(1);
        expect(result.paste.item.documents[0]?.name).toBe("Plans");
    });

    test("names the other kind instead of filling the wrong form", () => {
        const result = readExtensionPaste({ kind: "mcp", text: JSON.stringify(skill) });

        expect(result.ok).toBe(false);
        if (result.ok) return;

        expect(result.problem).toBe("That is a skill export; this form adds an MCP server.");
    });

    test("says what a configuration is missing", () => {
        const result = readExtensionPaste({
            kind: "skill",
            text: JSON.stringify({ name: "No slug", description: "x", body: "y" }),
        });

        expect(result.ok).toBe(false);
        if (result.ok) return;

        expect(result.problem).toContain("That isn't a skill this app saves");
        expect(result.problem).toContain("slug");
    });

    test("says when the text isn't JSON yet", () => {
        expect(readExtensionPaste({ kind: "mcp", text: "{ nope" })).toEqual({
            ok: false,
            problem: "That isn't JSON yet.",
        });
    });

    test("says when there is nothing to read", () => {
        expect(readExtensionPaste({ kind: "mcp", text: "   " })).toEqual({
            ok: false,
            problem: "Paste an export first.",
        });
    });

    test("says when the export holds nothing for this page", () => {
        const result = readExtensionPaste({
            kind: "tool",
            text: JSON.stringify({ format: "cobble-extensions", version: 1, items: [] }),
        });

        expect(result).toEqual({ ok: false, problem: "That holds no tools." });
    });
});