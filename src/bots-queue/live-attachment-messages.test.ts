import { describe, expect, test } from "bun:test";
import type { BotMessageWithAttachments } from "@/src/types";
import liveAttachmentMessages from "./live-attachment-messages";

const message = ({ id, files }: { id: number; files?: number }): BotMessageWithAttachments => ({
    id,
    attachments: files
        ? Array.from({ length: files }, (_unused, index) => ({
              id: index + 1,
              name: `file-${index + 1}.png`,
              media_type: "image",
              url: `/media/${index + 1}.png`,
          }))
        : undefined,
});

describe("liveAttachmentMessages", () => {
    test("hands over the files of the latest messages that have any", () => {
        const messages = [
            message({ id: 1 }),
            message({ id: 2, files: 1 }),
            message({ id: 3 }),
            message({ id: 4, files: 2 }),
            message({ id: 5 }),
        ];

        expect(
            liveAttachmentMessages({ messages, max_messages: 4, max_age: 8 }),
        ).toEqual([2, 4]);
    });

    test("only the newest few file-bearing messages", () => {
        const messages = [
            message({ id: 1, files: 1 }),
            message({ id: 2, files: 1 }),
            message({ id: 3, files: 1 }),
            message({ id: 4, files: 1 }),
        ];

        expect(
            liveAttachmentMessages({ messages, max_messages: 2, max_age: 8 }),
        ).toEqual([3, 4]);
    });

    test("a file far back is named, not re-attached", () => {
        const messages = [
            message({ id: 1, files: 1 }),
            ...Array.from({ length: 20 }, (_unused, index) => message({ id: index + 2 })),
        ];

        expect(
            liveAttachmentMessages({ messages, max_messages: 4, max_age: 8 }),
        ).toEqual([]);
    });

    test("keeps a file that is still inside the age bound", () => {
        const messages = [
            message({ id: 1, files: 1 }),
            ...Array.from({ length: 6 }, (_unused, index) => message({ id: index + 2 })),
        ];

        expect(
            liveAttachmentMessages({ messages, max_messages: 4, max_age: 8 }),
        ).toEqual([1]);
    });

    test("no files, nothing to hand over", () => {
        expect(
            liveAttachmentMessages({
                messages: [message({ id: 1 }), message({ id: 2 })],
            }),
        ).toEqual([]);
    });
});
