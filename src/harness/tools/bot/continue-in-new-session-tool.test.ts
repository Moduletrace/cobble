import { describe, expect, test } from "bun:test";
import botMessagesToHarness from "@/src/bots-queue/bot-messages-to-harness";
import continueInNewSessionTool from "./continue-in-new-session-tool";

const signal = new AbortController().signal;

function tool() {
    const summaries: string[] = [];
    const titles: (string | undefined)[] = [];
    const moved_to: number[] = [];
    const move = continueInNewSessionTool({
        bot_id: 2,
        user_id: 1,
        session_id: 100,
        move: async ({ summary, title }) => {
            summaries.push(summary);
            titles.push(title);
            return { session_id: 101 };
        },
        onMove: ({ session_id }) => moved_to.push(session_id),
    });

    return { move, summaries, titles, moved_to };
}

describe("continueInNewSessionTool", () => {
    test("moves with the bot's summary and hands the run the new session", async () => {
        const { move, summaries, moved_to } = tool();

        const result = await move.run({ args: { summary: "- Wants the Q3 report as a PDF" }, signal });

        expect(summaries).toEqual(["- Wants the Q3 report as a PDF"]);
        expect(moved_to).toEqual([101]);
        expect(result).toContain("new session");
    });

    test("passes the new session's title on", async () => {
        const { move, titles } = tool();

        await move.run({ args: { summary: "- Q3 report", title: "Q3 report PDF" }, signal });

        expect(titles).toEqual(["Q3 report PDF"]);
    });

    test("moves once per reply", async () => {
        const { move, summaries } = tool();

        await move.run({ args: { summary: "- First" }, signal });

        await expect(move.run({ args: { summary: "- Again" }, signal })).rejects.toThrow("already moved");
        expect(summaries).toEqual(["- First"]);
    });

    test("the summary opening a session never reaches the model as a turn (the prompt carries it)", () => {
        const turns = botMessagesToHarness({
            messages: [
                { id: 1, author: "bot", text: "- Wants the Q3 report as a PDF" },
                { id: 2, author: "bot", text: "Fresh session, carrying on." },
                { id: 3, author: "user", text: "Great, go on." },
            ],
        });

        expect(turns).toEqual([{ role: "user", content: "Great, go on." }]);
    });
});
