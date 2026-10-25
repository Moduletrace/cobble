import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import type { ExtensionProposalView } from "@/src/types";
import ProposalCard from "./proposal-card";

const github: ExtensionProposalView = {
    id: 7,
    kind: "mcp",
    extension_id: null,
    name: "GitHub",
    status: "pending",
    expired: false,
    expires_at: Date.now() + 60 * 60 * 1000,
    outcome: "",
    result_id: null,
    host: "api.githubcopilot.com",
    envs: [
        { key: "GITHUB_TOKEN", where: "header Authorization", saved_in: ["general"] },
        { key: "GITHUB_ORG", where: "URL", saved_in: [] },
    ],
    details: [
        { label: "Name", value: "GitHub" },
        { label: "Headers", value: "Authorization: Bearer {{env.GITHUB_TOKEN}}", block: true },
    ],
    research: "GitHub publishes this server in its own docs.",
    sources: ["https://docs.github.com/en/copilot"],
};

function render({ view }: { view: ExtensionProposalView }) {
    return renderToString(<ProposalCard view={view} onDecided={() => {}} />);
}

describe("ProposalCard", () => {
    test("shows the host, each key and whether it's saved, and the bot's check", () => {
        const html = render({ view: github });

        expect(html).toContain("api.githubcopilot.com");
        expect(html).toContain("GITHUB_TOKEN");
        expect(html).toContain("Saved · general");
        expect(html).toContain("Missing");
        expect(html).toContain("Background check (written by the bot)");
        expect(html).toContain("https://docs.github.com/en/copilot");
        expect(html).toContain(">Confirm<");
    });

    test("offers no buttons once it's decided or expired", () => {
        expect(render({ view: { ...github, status: "confirmed", outcome: "Saved as MCP server #9." } })).not.toContain(
            ">Confirm<",
        );
        expect(render({ view: { ...github, expired: true } })).not.toContain(">Confirm<");
    });

    test("a skill shows its runbook and review, with no host or keys", () => {
        const html = render({
            view: {
                ...github,
                kind: "skill",
                name: "Weekly SEO report",
                host: null,
                envs: [],
                details: [{ label: "Hosts", value: "files.example" }],
                sources: [],
            },
        });

        expect(html).not.toContain("Where it sends");
        expect(html).toContain("Review (written by the bot)");
        expect(html).toContain("files.example");
        expect(html).toContain("No pages given.");
    });
});
