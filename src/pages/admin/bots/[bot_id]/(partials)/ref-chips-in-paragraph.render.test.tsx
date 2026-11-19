import { afterAll, describe, expect, mock, test } from "bun:test";
import { renderToString } from "react-dom/server";
import P from "@moduletrace/twui/layout/P";
import type {
    BotQuestionView,
    ExtensionProposalView,
    HookProposalView,
    SecretRefView,
    SecretRequestView,
} from "@/src/types";

const question: BotQuestionView = {
    id: 1,
    title: "Deploy now?",
    questions: [{ question: "When?", kind: "single", options: ["Now", "Later"], allow_other: false }],
    answers: null,
    status: "pending",
    bot_id: 2,
    bot_name: "Ada",
};

const secret_request: SecretRequestView = {
    id: 3,
    key: "GITHUB_TOKEN",
    description: "A token to push.",
    reason: "To push the branch.",
    status: "pending",
    bot_id: 2,
    bot_name: "Ada",
    env_id: null,
};

const proposal: ExtensionProposalView = {
    id: 4,
    kind: "mcp",
    extension_id: null,
    name: "GitHub",
    status: "pending",
    expired: false,
    expires_at: 0,
    outcome: "",
    result_id: null,
    host: null,
    envs: [],
    details: [],
    research: "",
    sources: [],
};

const hook_proposal: HookProposalView = {
    id: 5,
    action: "create",
    hook_id: null,
    title: "GitHub pushes",
    bot_id: 2,
    bot_name: "Ada",
    status: "pending",
    expired: false,
    expires_at: 0,
    outcome: "",
    result_id: null,
    makes_url: true,
    details: [],
    reason: "So it hears about pushes.",
};

const secret: SecretRefView = {
    id: 6,
    key: "NPM_TOKEN",
    description: "A token to publish.",
    can_reveal: true,
};

mock.module("../(hooks)/use-bot-question", () => ({
    default: () => ({ view: question, loading: false, setView: () => {} }),
}));
mock.module("../(hooks)/use-secret-request", () => ({
    default: () => ({ view: secret_request, loading: false, setView: () => {} }),
}));
mock.module("../(hooks)/use-extension-proposal", () => ({
    default: () => ({ view: proposal, loading: false, setView: () => {} }),
}));
mock.module("../(hooks)/use-hook-proposal", () => ({
    default: () => ({ view: hook_proposal, loading: false, setView: () => {} }),
}));
mock.module("../(hooks)/use-secret-ref", () => ({
    default: () => ({ view: secret, loading: false }),
}));

const { default: BotQuestionRefChip } = await import("./bot-question-ref-chip");
const { default: SecretRequestRefChip } = await import("./secret-request-ref-chip");
const { default: ProposalRefChip } = await import("./proposal-ref-chip");
const { default: HookProposalRefChip } = await import("./hook-proposal-ref-chip");
const { default: SecretRefChip } = await import("./secret-ref-chip");

/**
 * twui's Button fills itself with a div, valid inside a button (React only
 * warns about a p in button scope), so what a paragraph may not hold is a
 * div outside one: twui's Modal used to wrap each chip's trigger in one.
 */
function outsideButtons(html: string) {
    return html.replaceAll(/<button[\s\S]*?<\/button>/g, "");
}

afterAll(() => {
    mock.restore();
});

/**
 * Message markdown renders bot text in real paragraphs, so every ref chip
 * that lands in it must be phrasing content: a block element beside its
 * text was React's "p cannot contain a nested div" warning, once per chip
 * on the page.
 */
describe("ref chips in a markdown paragraph", () => {
    test("a question chip", () => {
        const html = renderToString(
            <P noMargin>
                <BotQuestionRefChip question_id={question.id} />
            </P>,
        );

        expect(html).toContain("Deploy now?");
        expect(outsideButtons(html)).not.toContain("<div");
    });

    test("a secret request chip", () => {
        const html = renderToString(
            <P noMargin>
                <SecretRequestRefChip request_id={secret_request.id} />
            </P>,
        );

        expect(html).toContain("GITHUB_TOKEN");
        expect(outsideButtons(html)).not.toContain("<div");
    });

    test("an extension proposal chip", () => {
        const html = renderToString(
            <P noMargin>
                <ProposalRefChip proposal_id={proposal.id} />
            </P>,
        );

        expect(html).toContain("Add MCP server GitHub");
        expect(outsideButtons(html)).not.toContain("<div");
    });

    test("a hook proposal chip", () => {
        const html = renderToString(
            <P noMargin>
                <HookProposalRefChip proposal_id={hook_proposal.id} />
            </P>,
        );

        expect(html).toContain("Add hook GitHub pushes");
        expect(outsideButtons(html)).not.toContain("<div");
    });

    test("a secret chip", () => {
        const html = renderToString(
            <P noMargin>
                <SecretRefChip env_id={secret.id} />
            </P>,
        );

        expect(html).toContain("NPM_TOKEN");
        expect(outsideButtons(html)).not.toContain("<div");
    });
});