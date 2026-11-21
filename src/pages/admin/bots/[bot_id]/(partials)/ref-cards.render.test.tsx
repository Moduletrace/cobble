import { afterAll, describe, expect, mock, test } from "bun:test";
import { renderToString } from "react-dom/server";
import type {
    BotQuestionView,
    ExtensionProposalView,
    HookProposalView,
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

const { default: BotQuestionRefCard } = await import("./bot-question-ref-card");
const { default: SecretRequestRefCard } = await import("./secret-request-ref-card");
const { default: ProposalRefCard } = await import("./proposal-ref-card");
const { default: HookProposalRefCard } = await import("./hook-proposal-ref-card");
const { default: MarkdownParagraph } = await import("./markdown-paragraph");
const { default: MarkdownLink } = await import("./markdown-link");

afterAll(() => {
    mock.restore();
});

/**
 * A card a bot puts up in the chat (a plan's steps, its questions, a
 * proposal, a secret request) shows in full under the message, the way the
 * plan card does, instead of behind a chip that opens a modal.
 */
describe("cards in a bot message", () => {
    test("questions show what is asked and can be answered there", () => {
        const html = renderToString(<BotQuestionRefCard question_id={question.id} />);

        expect(html).toContain("Deploy now?");
        expect(html).toContain("Waiting for you");
        expect(html).toContain("When?");
        expect(html).toContain("Now");
    });

    test("a secret request shows the key it asks for", () => {
        const html = renderToString(<SecretRequestRefCard request_id={secret_request.id} />);

        expect(html).toContain("GITHUB_TOKEN");
        expect(html).toContain("Waiting for you");
        expect(html).toContain("never does");
    });

    test("an extension proposal shows what would be saved", () => {
        const html = renderToString(<ProposalRefCard proposal_id={proposal.id} />);

        expect(html).toContain("Add MCP server GitHub");
        expect(html).toContain("Waiting for you");
    });

    test("a hook proposal shows what it would hear", () => {
        const html = renderToString(<HookProposalRefCard proposal_id={hook_proposal.id} />);

        expect(html).toContain("Add hook GitHub pushes");
        expect(html).toContain("Waiting for you");
    });
});

/**
 * A markdown paragraph is a `p`, which takes phrasing content only, so a
 * card ref written on its own line has to be lifted out of it: otherwise
 * React reports "p cannot contain a nested div" for every card on the
 * page.
 */
describe("MarkdownParagraph", () => {
    test("keeps plain text in one paragraph", () => {
        const html = renderToString(<MarkdownParagraph>Just a line.</MarkdownParagraph>);

        expect(html).toContain("Just a line.");
        expect(html).not.toContain("<div");
    });

    test("lifts a card ref out of the paragraph, text before and after", () => {
        const html = renderToString(
            <MarkdownParagraph>
                {"Before "}
                <MarkdownLink href={`#question-${question.id}`}>questions</MarkdownLink>
                {" after"}
            </MarkdownParagraph>,
        );

        expect(html).toContain("Before");
        expect(html).toContain("Deploy now?");
        expect(html).toContain("after");

        const before = html.indexOf("Before");
        const paragraph_end = html.indexOf("</p>", before);
        const card = html.indexOf("Deploy now?");
        const after = html.indexOf("after", card);

        expect(paragraph_end).toBeGreaterThan(before);
        expect(card).toBeGreaterThan(paragraph_end);
        expect(after).toBeGreaterThan(card);
        expect(html.indexOf("<p", after)).toBeGreaterThan(card);
    });
});