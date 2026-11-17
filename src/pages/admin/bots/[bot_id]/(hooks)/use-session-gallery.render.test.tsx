import { expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import { AppContext } from "@/src/pages/__root";
import type { AppContextObject, BotMessageAttachment, BotMessageWithAttachments, PublicBotFile } from "@/src/types";
import useSessionGallery from "./use-session-gallery";

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

function attachment({ id, url }: { id: number; url: string }): BotMessageAttachment {
    return { id, name: `file-${id}`, media_type: "image", url };
}

function msg({ id, text = "", attachments }: { id: number; text?: string; attachments?: BotMessageAttachment[] }): BotMessageWithAttachments {
    return { id, author: "bot", text, attachments } as BotMessageWithAttachments;
}

function Probe({ messages }: { messages: BotMessageWithAttachments[] }) {
    const gallery = useSessionGallery({ messages });

    return <>{gallery.map((item) => item.url).join(" ")}</>;
}

function render({ messages, files }: { messages: BotMessageWithAttachments[]; files: PublicBotFile[] }) {
    const context = { pageProps: { bot: { id: 3 }, bot_files: { files } } } as unknown as AppContextObject;

    return renderToString(
        <AppContext.Provider value={context}>
            <Probe messages={messages} />
        </AppContext.Provider>,
    );
}

test("the thread's gallery gathers every message's images, bot and user, in order", () => {
    const messages = [
        msg({ id: 1, attachments: [attachment({ id: 1, url: "/media/1" })] }),
        msg({ id: 2, text: "Saved [file:12]." }),
        msg({ id: 3, attachments: [attachment({ id: 3, url: "/media/3" })] }),
    ];

    expect(render({ messages, files: [shot] })).toBe("/media/1 /media/40 /media/3");
});

test("a file named by two messages resolves once, at its first place", () => {
    const messages = [msg({ id: 1, text: "[file:12]" }), msg({ id: 2, text: "[file:12] and [file:14]" })];

    expect(render({ messages, files: [shot, photo] })).toBe("/media/40 /media/50");
});

test("no images, no gallery", () => {
    expect(render({ messages: [msg({ id: 1, text: "Just text." })], files: [] })).toBe("");
});
