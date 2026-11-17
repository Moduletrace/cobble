import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import { AppContext } from "@/src/pages/__root";
import type { AppContextObject, BotMessageAttachment, BotMessageWithAttachments, PublicBotFile } from "@/src/types";
import MessageImages from "./message-images";

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

const report: PublicBotFile = {
    ...shot,
    id: 13,
    name: "report.md",
    path: "reports/report.md",
    media_type: "document",
    url: "/media/41",
    thumbnail_url: undefined,
    full_path: "bots/3/reports/report.md",
};

const attached: BotMessageAttachment = {
    id: 40,
    name: "made.png",
    media_type: "image",
    url: "/media/40",
    thumbnail_url: "/media/40/thumbnail",
    file_id: 12,
};

type RenderProps = {
    message: Partial<BotMessageWithAttachments>;
    files?: PublicBotFile[];
};

function render({ message, files = [] }: RenderProps) {
    const context = { pageProps: { bot_files: { files } } } as unknown as AppContextObject;

    return renderToString(
        <AppContext.Provider value={context}>
            <MessageImages message={{ id: 1, ...message } as BotMessageWithAttachments} />
        </AppContext.Provider>,
    );
}

describe("MessageImages", () => {
    test("shows an attached image as a thumbnail opening its preview", () => {
        const html = render({ message: { text: "Here it is.", attachments: [attached] } });

        expect(html).toContain("<img");
        expect(html).toContain('src="/media/40/thumbnail"');
        expect(html).toContain('href="/media/40"');
        expect(html).toContain('title="made.png"');
    });

    test("shows an image file the message names", () => {
        const html = render({ message: { text: "Saved [file:12] for you." }, files: [shot] });

        expect(html).toContain('src="/media/40/thumbnail"');
        expect(html).toContain('title="chart.png"');
    });

    test("a file attached and named shows once", () => {
        const html = render({
            message: { text: "Saved [file:12] for you.", attachments: [attached] },
            files: [shot],
        });

        expect(html.match(/<img/g)).toHaveLength(1);
    });

    test("leaves out non-image files and refs inside longer code", () => {
        const html = render({
            message: { text: "The [file:13] report, and ```\n[file:12]\n``` stays code." },
            files: [shot, report],
        });

        expect(html).toBe("");
    });

    test("a ref quoted alone in a code span still shows its picture", () => {
        const html = render({ message: { text: "saved as `[file:12]`" }, files: [shot] });

        expect(html).toContain('title="chart.png"');
    });

    test("renders nothing without images", () => {
        expect(render({ message: { text: "Just text." } })).toBe("");
        expect(render({ message: { text: "[file:99] is gone." }, files: [shot] })).toBe("");
    });
});
