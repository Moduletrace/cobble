import { describe, expect, test } from "bun:test";
import retryReplyProblem from "./retry-reply-problem";

const notice = { author: "bot", failed_job_id: 7 };

const can_retry = {
    message: notice,
    job_kind: "reply",
    session_status: "active",
    latest_user_id: 10,
};

describe("retryReplyProblem", () => {
    test("a reply failure in an active session with an unanswered message can be retried", () => {
        expect(retryReplyProblem({ ...can_retry })).toBeNull();
        expect(retryReplyProblem({ ...can_retry, answered_id: 9 })).toBeNull();
    });

    test("only a bot's failure notice is retryable", () => {
        expect(retryReplyProblem({ ...can_retry, message: null })).toBe(
            `Only a failed reply can be retried.`,
        );
        expect(
            retryReplyProblem({ ...can_retry, message: { author: "user", failed_job_id: 7 } }),
        ).toBe(`Only a failed reply can be retried.`);
        expect(
            retryReplyProblem({ ...can_retry, message: { author: "bot", failed_job_id: null } }),
        ).toBe(`Only a failed reply can be retried.`);
    });

    test("only a reply job is retryable, and a pruned job is not", () => {
        expect(retryReplyProblem({ ...can_retry, job_kind: "task" })).toBe(
            `Only a failed reply can be retried.`,
        );
        expect(retryReplyProblem({ ...can_retry, job_kind: null })).toBe(
            `Only a failed reply can be retried.`,
        );
    });

    test("a conversation that moved on can't be retried into", () => {
        expect(retryReplyProblem({ ...can_retry, session_status: "closed" })).toBe(
            `This conversation has moved on.`,
        );
        expect(retryReplyProblem({ ...can_retry, session_status: null })).toBe(
            `This conversation has moved on.`,
        );
    });

    test("a reply already on its way is not retried beside", () => {
        expect(retryReplyProblem({ ...can_retry, open_reply_id: 12 })).toBe(
            `A reply is already on its way.`,
        );
    });

    test("a session with no user message has nothing to answer", () => {
        expect(retryReplyProblem({ ...can_retry, latest_user_id: null })).toBe(
            `There is nothing to reply to.`,
        );
    });

    test("an already answered message is not answered twice", () => {
        expect(retryReplyProblem({ ...can_retry, answered_id: 10 })).toBe(
            `The latest message has already been answered.`,
        );
        expect(retryReplyProblem({ ...can_retry, answered_id: 11 })).toBe(
            `The latest message has already been answered.`,
        );
    });
});
