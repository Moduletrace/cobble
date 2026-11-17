import { describe, expect, test } from "bun:test";
import type { BotMessageAttachment, BotMessageWithAttachments, PublicBotFile } from "@/src/types";
import sessionImageGallery from "./session-image-gallery";

const shot: PublicBotFile = {
    id: 12,
    name: "chart.png",
    path: "reports/chart.png",
    size: 2048,
    media_type: "image",
    purpose: "writing",
    scope: "bot",
    owner_id: 3,
    created_at: 1,
    url: "/media/40",
    thumbnail_url: "/media/40/thumbnail",
    full_path: "bots/3/reports/chart.png",
};

const photo: PublicBotFile = { ...shot, id: 14, name: "photo.png", url: "/media/50", thumbnail_url: "/media/50/thumbnail" };
const report: PublicBotFile = { ...shot, id: 13, name: "report.md", media_type: "document", url: "/media/41", thumbnail_url: undefined };

function attachment({ id, url, media_type = "image", file_id }: { id: number; url: string; media_type?: BotMessageAttachment["media_type"]; file_id?: number }): BotMessageAttachment {
    return { id, name: `file-${id}`, media_type, url, file_id };
}

function msg({ id, text = "", attachments }: { id: number; text?: string; attachments?: BotMessageAttachment[] }): BotMessageWithAttachments {
    return { id, author: "bot", text, attachments } as BotMessageWithAttachments;
}

const urls = (items: { url: string }[]) => items.map((it) => it.url);

describe("sessionImageGallery", () => {
    test("collects user and bot images in the order the messages show them", () => {
        const messages = [
            msg({ id: 1, attachments: [attachment({ id: 1, url: "/media/1" })] }),
            msg({ id: 2, attachments: [attachment({ id: 2, url: "/media/2" })] }),
            msg({ id: 3, attachments: [attachment({ id: 3, url: "/media/3" })] }),
        ];

        expect(urls(sessionImageGallery({ messages, files: new Map() }))).toEqual(["/media/1", "/media/2", "/media/3"]);
    });

    test("a message's attachments come before the files it names", () => {
        const messages = [msg({ id: 1, text: "Saved [file:12].", attachments: [attachment({ id: 9, url: "/media/9" })] })];

        expect(urls(sessionImageGallery({ messages, files: new Map([[12, shot]]) }))).toEqual(["/media/9", "/media/40"]);
    });

    test("a file attached and named appears once", () => {
        const messages = [msg({ id: 1, text: "Saved [file:12].", attachments: [attachment({ id: 40, url: "/media/40", file_id: 12 })] })];

        expect(urls(sessionImageGallery({ messages, files: new Map([[12, shot]]) }))).toEqual(["/media/40"]);
    });

    test("a picture named by two messages appears once, at its first place", () => {
        const messages = [
            msg({ id: 1, text: "First [file:12]." }),
            msg({ id: 2, attachments: [attachment({ id: 2, url: "/media/2" })] }),
            msg({ id: 3, text: "Again [file:12]." }),
        ];

        expect(urls(sessionImageGallery({ messages, files: new Map([[12, shot]]) }))).toEqual(["/media/40", "/media/2"]);
    });

    test("two attachments of the same bytes appear once", () => {
        const messages = [
            msg({ id: 1, attachments: [attachment({ id: 1, url: "/media/1" })] }),
            msg({ id: 2, attachments: [attachment({ id: 2, url: "/media/1" })] }),
        ];

        expect(urls(sessionImageGallery({ messages, files: new Map() }))).toEqual(["/media/1"]);
    });

    test("leaves out non-image attachments and files", () => {
        const messages = [
            msg({ id: 1, text: "The [file:13] report.", attachments: [attachment({ id: 5, url: "/media/5", media_type: "document" })] }),
        ];

        expect(sessionImageGallery({ messages, files: new Map([[13, report]]) })).toEqual([]);
    });

    test("refs inside longer code stay out, a ref quoted alone in a code span joins", () => {
        const messages = [msg({ id: 1, text: "```\n[file:12]\n``` but `[file:14]` shows." })];

        expect(urls(sessionImageGallery({ messages, files: new Map([[12, shot], [14, photo]]) }))).toEqual(["/media/50"]);
    });

    test("skips a file still loading or the user can't reach", () => {
        const messages = [msg({ id: 1, text: "[file:12] and [file:99]." })];

        expect(urls(sessionImageGallery({ messages, files: new Map([[12, null]]) }))).toEqual([]);
    });

    test("an empty conversation has no gallery", () => {
        expect(sessionImageGallery({ messages: [], files: new Map() })).toEqual([]);
        expect(sessionImageGallery({ messages: [msg({ id: 1, text: "Just text." })], files: new Map() })).toEqual([]);
    });
});
