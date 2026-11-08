import { describe, expect, test } from "bun:test";
import messageTaskIds from "./message-task-ids";

describe("messageTaskIds", () => {
    test("reads a stored list", () => {
        expect(messageTaskIds({ task_ids: "[3,12]" })).toEqual([3, 12]);
    });

    test("keeps each id once, in first-touched order", () => {
        expect(messageTaskIds({ task_ids: [12, 3, 12, "3", 7] })).toEqual([12, 3, 7]);
    });

    test("drops what isn't a task id", () => {
        expect(messageTaskIds({ task_ids: [0, -2, 1.5, "x", null, undefined, 4] })).toEqual([4]);
    });

    test("reads nothing from an empty or broken value", () => {
        expect(messageTaskIds({ task_ids: null })).toEqual([]);
        expect(messageTaskIds({ task_ids: "" })).toEqual([]);
        expect(messageTaskIds({ task_ids: "not json" })).toEqual([]);
        expect(messageTaskIds({ task_ids: '{"id":3}' })).toEqual([]);
    });
});
