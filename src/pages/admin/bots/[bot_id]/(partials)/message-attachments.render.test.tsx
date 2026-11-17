import { expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import type { BotMessageAttachment, FilePreviewItem } from "@/src/types";
import { SessionGalleryContext } from "../(data)/session-gallery-context";
import MessageAttachments from "./message-attachments";

const attached: BotMessageAttachment = {
    id: 40,
    name: "made.png",
    media_type: "image",
    url: "/media/40",
    thumbnail_url: "/media/40/thumbnail",
};

function render({ attachments, session_gallery = null }: { attachments?: BotMessageAttachment[]; session_gallery?: FilePreviewItem[] | null }) {
    return renderToString(
        <SessionGalleryContext.Provider value={session_gallery}>
            <MessageAttachments attachments={attachments} />
        </SessionGalleryContext.Provider>,
    );
}

test("shows a user's attached image as a thumbnail opening its preview", () => {
    const html = render({ attachments: [attached] });

    expect(html).toContain("<img");
    expect(html).toContain('src="/media/40/thumbnail"');
    expect(html).toContain('href="/media/40"');
    expect(html).toContain('title="made.png"');
});

test("renders nothing without attachments", () => {
    expect(render({ attachments: [] })).toBe("");
    expect(render({})).toBe("");
});

test("with the conversation's gallery provided it still shows its thumbnails", () => {
    const html = render({ attachments: [attached], session_gallery: [{ name: "other.png", url: "/media/77" }] });

    expect(html).toContain('src="/media/40/thumbnail"');
});
