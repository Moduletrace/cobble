import { describe, expect, test } from "bun:test";
import {
    ThreadBottomSlack,
    shouldFollowThread,
    threadOffset,
} from "./thread-scroll";

describe("threadOffset", () => {
    test("content whose bottom edge is the column's is at the bottom", () => {
        expect(
            threadOffset({ content_bottom: 800, column_bottom: 800 }),
        ).toEqual({ distance: 0, near_bottom: true });
    });

    test("content ending just short of the column's bottom is at the bottom", () => {
        expect(
            threadOffset({ content_bottom: 780, column_bottom: 800 }),
        ).toEqual({ distance: 0, near_bottom: true });
    });

    test("a small offset past the bottom still counts as being there", () => {
        const offset = threadOffset({
            content_bottom: 800 + ThreadBottomSlack - 1,
            column_bottom: 800,
        });

        expect(offset.near_bottom).toBe(true);
        expect(offset.distance).toBe(ThreadBottomSlack - 1);
    });

    test("one pixel past the slack is not the bottom anymore", () => {
        const offset = threadOffset({
            content_bottom: 800 + ThreadBottomSlack + 1,
            column_bottom: 800,
        });

        expect(offset.near_bottom).toBe(false);
        expect(offset.distance).toBe(ThreadBottomSlack + 1);
    });

    test("scrolled up by a long way is far from the bottom", () => {
        expect(
            threadOffset({ content_bottom: 4800, column_bottom: 800 }),
        ).toEqual({ distance: 4000, near_bottom: false });
    });

    test("the slack is configurable", () => {
        expect(
            threadOffset({
                content_bottom: 1000,
                column_bottom: 800,
                slack: 200,
            }).near_bottom,
        ).toBe(true);
    });
});

describe("shouldFollowThread", () => {
    test("a chat at the bottom follows a bot's reply", () => {
        expect(
            shouldFollowThread({
                near_bottom: true,
                newest_author: "bot",
                kept_last_message: true,
            }),
        ).toBe(true);
    });

    test("a chat scrolled up stays put when a bot's reply lands", () => {
        expect(
            shouldFollowThread({
                near_bottom: false,
                newest_author: "bot",
                kept_last_message: true,
            }),
        ).toBe(false);
    });

    test("a message the user sent always brings the thread to it", () => {
        expect(
            shouldFollowThread({
                near_bottom: false,
                newest_author: "user",
                kept_last_message: true,
            }),
        ).toBe(true);
    });

    test("a list that replaced the old one opens at its bottom", () => {
        expect(
            shouldFollowThread({
                near_bottom: false,
                newest_author: "bot",
                kept_last_message: false,
            }),
        ).toBe(true);
    });
});
