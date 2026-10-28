import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import type { BotQuestionView } from "@/src/types";
import BotQuestionCard from "./bot-question-card";

const deploy: BotQuestionView = {
    id: 4,
    title: "Before I deploy",
    questions: [
        { question: "Which environment?", kind: "single", options: ["Staging (suggested)", "Production"], allow_other: true },
        { question: "Which checks should run first?", kind: "multiple", options: ["Lint", "Tests"], allow_other: false },
    ],
    answers: null,
    status: "pending",
    bot_id: 6,
    bot_name: "Ada",
};

function render({ view }: { view: BotQuestionView }) {
    return renderToString(<BotQuestionCard view={view} onDecided={() => {}} onDone={() => {}} />);
}

describe("BotQuestionCard", () => {
    test("asks each question with radios for one pick and checkboxes for several", () => {
        const html = render({ view: deploy });

        expect(html).toContain("Which environment?");
        expect(html).toContain(`type="radio"`);
        expect(html).toContain("Staging (suggested)");
        expect(html).toContain(">Other<");
        expect(html).toContain("twui-checkbox");
        expect(html).toContain("Pick any");
        expect(html).toContain(">Send answers<");
    });

    test("once answered, shows what was picked and offers no inputs", () => {
        const html = render({
            view: {
                ...deploy,
                status: "answered",
                answers: [
                    { choices: [], other: "QA box" },
                    { choices: [0, 1], other: "" },
                ],
            },
        });

        expect(html).not.toContain(`type="radio"`);
        expect(html).not.toContain(">Send answers<");
        expect(html).toContain("Other: QA box");
        expect(html).toContain("Lint; Tests");
    });

    test("once skipped, says so", () => {
        expect(render({ view: { ...deploy, status: "skipped" } })).toContain("Nothing was answered");
    });
});
