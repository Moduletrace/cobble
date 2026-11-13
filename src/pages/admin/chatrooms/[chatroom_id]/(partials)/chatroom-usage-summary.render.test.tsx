import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import type { ChatroomUsage } from "@/src/types";
import ChatroomUsageSummary from "./chatroom-usage-summary";

const usage: ChatroomUsage = {
    totals: {
        prompt_tokens: 12_400,
        cached_tokens: 6200,
        completion_tokens: 1600,
        total_tokens: 14_000,
        cost: 0.042,
        calls: 7,
    },
    failed_calls: 2,
    by_bot: [
        {
            bot_id: 10,
            name: "Ember",
            prompt_tokens: 10_400,
            cached_tokens: 6000,
            completion_tokens: 1100,
            total_tokens: 11_500,
            cost: 0.031,
            calls: 4,
        },
        {
            bot_id: 20,
            name: null,
            prompt_tokens: 2000,
            completion_tokens: 500,
            total_tokens: 2500,
            cost: 0.011,
            calls: 3,
        },
    ],
};

describe("ChatroomUsageSummary", () => {
    test("totals what the room spent, and what failed", () => {
        const html = renderToString(<ChatroomUsageSummary usage={usage} />);

        expect(html).toContain("What this room spent");
        expect(html).toContain("14K");
        expect(html).toContain("12K in (50% cached), 1.6K out");
        expect(html).toContain("7");
        expect(html).toContain("2 failed");
        expect(html).toContain("$0.0420");
    });

    test("splits it by bot, naming a bot that's gone", () => {
        const html = renderToString(<ChatroomUsageSummary usage={usage} />);

        expect(html).toContain("By bot");
        expect(html).toContain("Ember");
        expect(html).toContain("12K<!-- --> tokens");
        expect(html).toContain("4<!-- --> <!-- -->calls");
        expect(html).toContain("A removed bot");
        expect(html).toContain("2.5K<!-- --> tokens");
        expect(html).toContain("3<!-- --> <!-- -->calls");
    });

    test("says nothing was spent in a room with no calls yet", () => {
        const html = renderToString(
            <ChatroomUsageSummary
                usage={{
                    totals: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0, calls: 0 },
                    failed_calls: 0,
                    by_bot: [],
                }}
            />,
        );

        expect(html).toContain("Nothing spent yet");
        expect(html).toContain("Not reported");
        expect(html).not.toContain("By bot");
        expect(html).not.toContain("failed");
    });

    test("reads a room with no usage at all as nothing yet", () => {
        const html = renderToString(<ChatroomUsageSummary />);

        expect(html).toContain("Nothing spent yet");
    });
});