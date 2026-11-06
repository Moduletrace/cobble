import { describe, expect, test } from "bun:test";
import linkComputerRefs from "./link-computer-refs";
import taskRef, { taskRefId } from "./task-ref";

describe("taskRef", () => {
    test("names a task", () => {
        expect(taskRef({ id: 20 })).toBe("[task:20]");
    });

    test("reads the id back from its link", () => {
        expect(taskRefId({ href: "#task-20" })).toBe(20);
        expect(taskRefId({ href: "#task-0" })).toBeNull();
        expect(taskRefId({ href: "#task-x" })).toBeNull();
        expect(taskRefId({ href: "#bot-20" })).toBeNull();
        expect(taskRefId({ href: null })).toBeNull();
    });

    test("becomes a link in a message", () => {
        expect(linkComputerRefs({ text: "Filed as [task:20]." })).toBe("Filed as [task 20](#task-20).");
    });

    test("still links when quoted alone in code", () => {
        expect(linkComputerRefs({ text: "See `[task:20]`." })).toBe("See [task 20](#task-20).");
    });
});
