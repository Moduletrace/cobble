import { PDFDocument, type PDFPage } from "pdf-lib";
import {
    PdfColors,
    PdfMargin,
    PdfPageHeight,
    PdfPageWidth,
    drawBrandHeader,
    drawStyledLine,
    drawTextAt,
    wrapStyledSegments,
    type PdfColor,
    type PdfFonts,
    type StyledLine,
} from "./pdf-helpers";
import type { TextBlock } from "./html-blocks";

const FOOTER_SPACE = 140;
const BODY_AVAILABLE_WIDTH = PdfPageWidth - PdfMargin * 2;

export type RenderContext = {
    pdfDoc: PDFDocument;
    page: PDFPage;
    y: number;
    fonts: PdfFonts;
};

export type BlockRenderStyle = {
    /** Body font size in pt. */
    size: number;
    /** Vertical gap between lines within a block. */
    line_gap: number;
    /** Body text color. */
    color: PdfColor;
    blockquote_size: number;
    blockquote_indent: number;
    /** Extra space after a paragraph/blockquote block. */
    paragraph_after: number;
    /** Space before a heading block. */
    heading_level_gap: number;
    /** Extra space after a heading block. */
    heading_after: number;
    /** Extra space after a list item. */
    list_after: number;
    divider_before: number;
    divider_after: number;
};

const DefaultBlockStyle: BlockRenderStyle = {
    size: 11,
    line_gap: 12.5,
    color: PdfColors.black,
    blockquote_size: 10,
    blockquote_indent: 26,
    paragraph_after: 7,
    heading_level_gap: 8,
    heading_after: 6,
    list_after: 4,
    divider_before: 8,
    divider_after: 14,
};

/**
 * # Compact block style for tight content like invoice/quote notes.
 * Mirrors the ACCOUNT DETAILS section: small font, subdued color,
 * minimal margins.
 */
export const NotesBlockStyle: BlockRenderStyle = {
    size: 9.5,
    line_gap: 12.5,
    color: PdfColors.darkGray,
    blockquote_size: 9,
    blockquote_indent: 16,
    paragraph_after: 3,
    heading_level_gap: 5,
    heading_after: 4,
    list_after: 2,
    divider_before: 5,
    divider_after: 8,
};

/**
 * # Ensure `amount` points of vertical space remain on the current page.
 * Starts a fresh page (with letterhead) when there isn't enough room.
 */
export function ensureSpace(ctx: RenderContext, amount: number) {
    if (ctx.y + amount <= PdfPageHeight - FOOTER_SPACE) {
        return;
    }

    const page = ctx.pdfDoc.addPage([PdfPageWidth, PdfPageHeight]);
    ctx.page = page;
    ctx.y = drawBrandHeader({ page, fonts: ctx.fonts });
}

/**
 * # Render HTML-derived text blocks onto a PDF document.
 * Shared by letter bodies and invoice/quote notes.
 */
export function renderBlocks({
    blocks,
    fonts,
    ctx,
    style = DefaultBlockStyle,
}: {
    blocks: TextBlock[];
    fonts: PdfFonts;
    ctx: RenderContext;
    style?: BlockRenderStyle;
}): RenderContext {
    // Standard WinAnsi fonts cannot encode the ₦ glyph; PDFs use "NGN" instead.
    for (const block of blocks) {
        if (block.type == "divider") {
            continue;
        }

        for (const segment of block.segments) {
            segment.text = segment.text.replace(/\u20a6/g, "NGN ");
        }
    }

    for (const block of blocks) {
        switch (block.type) {
            case "paragraph":
            case "blockquote": {
                if (block.segments.length == 0) {
                    ctx.y += style.line_gap;
                    continue;
                }

                const is_blockquote = block.type == "blockquote";
                const indent = is_blockquote ? style.blockquote_indent : 0;
                const size = is_blockquote ? style.blockquote_size : style.size;

                const lines = wrapStyledSegments({
                    segments: block.segments,
                    fonts,
                    size,
                    max_width: BODY_AVAILABLE_WIDTH - indent,
                });

                for (const line of lines) {
                    ensureSpace(ctx, style.line_gap);

                    drawStyledLine(ctx.page, line, {
                        x: PdfMargin + indent,
                        y_from_top: ctx.y,
                        size,
                        color: style.color,
                    });
                    ctx.y += style.line_gap;
                }

                ctx.y += style.paragraph_after;
                break;
            }

            case "heading": {
                const size = style.size + (block.level <= 2 ? 3 : 1.5);

                const lines = wrapStyledSegments({
                    segments: block.segments,
                    fonts,
                    size,
                    max_width: BODY_AVAILABLE_WIDTH,
                });

                ensureSpace(ctx, lines.length * (size + 8) + 24);
                ctx.y += style.heading_level_gap;

                for (const line of lines) {
                    ensureSpace(ctx, size + 7);

                    const bold_line: StyledLine = {
                        words: line.words.map((word) => ({
                            ...word,
                            font:
                                word.font == fonts.italic
                                    ? fonts.boldItalic
                                    : fonts.bold,
                        })),
                        width: line.width,
                    };
                    drawStyledLine(ctx.page, bold_line, {
                        x: PdfMargin,
                        y_from_top: ctx.y,
                        size,
                        color: style.color,
                    });
                    ctx.y += size + 7;
                }

                ctx.y += style.heading_after;
                break;
            }

            case "list-item": {
                const marker = block.ordered ? `${block.index + 1}.` : "\u2022";
                const marker_text = `${marker}  `;
                const marker_width = fonts.regular.widthOfTextAtSize(
                    marker_text,
                    style.size,
                );
                const hang_indent = 18;
                const indent = PdfMargin + hang_indent;

                const lines = wrapStyledSegments({
                    segments: block.segments,
                    fonts,
                    size: style.size,
                    max_width:
                        BODY_AVAILABLE_WIDTH - hang_indent - marker_width,
                });

                for (const [line_index, line] of lines.entries()) {
                    ensureSpace(ctx, style.line_gap);

                    if (line_index == 0) {
                        drawTextAt(ctx.page, marker, {
                            x: PdfMargin,
                            y_from_top: ctx.y,
                            size: style.size,
                            font: fonts.regular,
                            color: style.color,
                        });
                    }

                    drawStyledLine(ctx.page, line, {
                        x: indent + (line_index == 0 ? marker_width : 0),
                        y_from_top: ctx.y,
                        size: style.size,
                        color: style.color,
                    });
                    ctx.y += style.line_gap;
                }

                ctx.y += style.list_after;
                break;
            }

            case "divider": {
                ensureSpace(ctx, 30);
                ctx.y += style.divider_before;
                ctx.page.drawRectangle({
                    x: PdfMargin,
                    y: ctx.page.getHeight() - ctx.y - 1,
                    width: BODY_AVAILABLE_WIDTH,
                    height: 1,
                    color: PdfColors.gray,
                });
                ctx.y += style.divider_after;
                break;
            }
        }
    }

    return ctx;
}
