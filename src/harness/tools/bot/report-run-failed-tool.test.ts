import { describe, expect, test } from "bun:test";
import reportRunFailedTool from "./report-run-failed-tool";

const signal = new AbortController().signal;

describe("reportRunFailedTool", () => {
    test("passes the reason on", async () => {
        const reasons: string[] = [];
        const tool = reportRunFailedTool({ onFail: ({ reason }) => reasons.push(reason) });

        await tool.run({ args: { reason: "  SMTP refused the login. " }, signal });

        expect(reasons).toEqual(["SMTP refused the login."]);
    });

    test("rejects an empty reason", () => {
        const tool = reportRunFailedTool({ onFail: () => {} });

        expect(tool.schema?.safeParse({ reason: "  " }).success).toBe(false);
    });
});
