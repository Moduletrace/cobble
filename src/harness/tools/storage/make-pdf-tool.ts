import { z } from "zod";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import recordBotFile from "@/src/functions/backend/db/bot-files/record-bot-file";
import type { HarnessTool } from "../../types";
import {
    describeScope,
    fileRef,
    findNamedScope,
    formatBytes,
    type StorageToolContext,
} from "./storage-tool-context";

type Args = {
    path: string;
    title?: string;
    content: string;
    attach?: boolean;
    scope?: string;
};

const PageWidth = 595.28;
const PageHeight = 841.89;
const Margin = 56;
const BodySize = 11;
const Leading = 15;

/**
 * Turns text into a PDF (headings, paragraphs and bullets) and saves it in
 * the bot's files. Made in the app with `pdf-lib`, so it needs no
 * computer.
 */
export default function makePdfTool(context: StorageToolContext): HarnessTool<Args> {
    const own = context.scopes[0];

    return {
        name: "make_pdf",
        description: `Make a PDF from text (markdown: "# " headings, "- " bullets, blank lines between paragraphs) and save it in your files. Send it to the user with "attach".`,
        schema: z.object({
            path: z.string().min(1).max(300).describe(`e.g. "reports/summary.pdf"`),
            title: z.string().max(200).optional(),
            content: z.string().min(1).max(100_000),
            attach: z.boolean().optional(),
            scope: z.string().optional(),
        }),
        run: async ({ args }) => {
            const named = args.scope
                ? findNamedScope({ scopes: context.scopes, name: args.scope })
                : own;

            if (!named) {
                return `You can't save there. Your directories: ${context.scopes
                    .map((s) => `${s.scope}:${s.owner_id}`)
                    .join(", ")}.`;
            }

            const bytes = await renderPdf({ title: args.title, content: args.content });
            const path = args.path.toLowerCase().endsWith(".pdf") ? args.path : `${args.path}.pdf`;

            const file = await recordBotFile({
                bot_id: context.bot_id,
                scope: named.scope,
                owner_id: named.owner_id,
                path,
                data: bytes,
                purpose: "pdf",
                source: "tool",
                mime_type: "application/pdf",
                user_id: context.user_id,
            });

            if (args.attach && file.media_id) {
                context.onAttach?.({ media_id: Number(file.media_id), name: file.name || "" });
            }

            return `Made ${file.path} (${formatBytes({ bytes: bytes.byteLength })}) in ${describeScope(named)}. ${fileRef({ file_id: file.id! })}`;
        },
    };
}

/**
 * Lays the text out on A4 pages. Fonts are the PDF standard ones, so
 * nothing has to be embedded.
 */
async function renderPdf({ title, content }: { title?: string; content: string }) {
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    let page = pdf.addPage([PageWidth, PageHeight]);
    let y = PageHeight - Margin;

    const newPage = () => {
        page = pdf.addPage([PageWidth, PageHeight]);
        y = PageHeight - Margin;
    };

    const write = ({
        text,
        size,
        use_bold,
        indent = 0,
        spacing = 0,
    }: {
        text: string;
        size: number;
        use_bold?: boolean;
        indent?: number;
        spacing?: number;
    }) => {
        const used = use_bold ? bold : font;
        const width = PageWidth - Margin * 2 - indent;
        const words = text.split(/\s+/);
        let line = "";

        const emit = (value: string) => {
            if (y - size < Margin) newPage();

            page.drawText(value, {
                x: Margin + indent,
                y: y - size,
                size,
                font: used,
                color: rgb(0.09, 0.09, 0.11),
            });

            y -= size + 4;
        };

        for (const word of words) {
            const candidate = line ? `${line} ${word}` : word;

            if (used.widthOfTextAtSize(candidate, size) > width && line) {
                emit(line);
                line = word;
            } else {
                line = candidate;
            }
        }

        if (line) emit(line);

        y -= spacing;
    };

    if (title) {
        write({ text: title, size: 20, use_bold: true, spacing: 10 });
    }

    for (const block of content.replace(/\r\n/g, "\n").split(/\n{2,}/)) {
        const trimmed = block.trim();

        if (!trimmed) continue;

        const heading = trimmed.match(/^(#{1,6})\s+(.*)$/);

        if (heading) {
            const level = heading[1]!.length;

            write({
                text: heading[2]!,
                size: level == 1 ? 16 : level == 2 ? 14 : 12,
                use_bold: true,
                spacing: 8,
            });
            continue;
        }

        for (const line of trimmed.split("\n")) {
            const bullet = line.match(/^\s*[-*+]\s+(.*)$/);

            if (bullet) {
                write({ text: `- ${bullet[1]}`, size: BodySize, indent: 12 });
            } else {
                write({ text: line.trim(), size: BodySize });
            }
        }

        y -= Leading / 2;
    }

    return new Uint8Array(await pdf.save());
}
