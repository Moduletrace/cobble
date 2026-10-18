import { PDFDocument } from "pdf-lib";
import {
    CompanyLetterheadDefaults,
    type CompanyLetterhead,
} from "@/src/dict/company-dict";
import {
    PdfColors,
    PdfMargin,
    PdfPageHeight,
    PdfPageWidth,
    drawBrandFooterOnAllPages,
    drawBrandHeader,
    drawTextAt,
    embedBrandLogo,
    embedPdfFonts,
    type PdfFonts,
} from "./pdf-helpers";
import htmlToTextBlocks from "./html-blocks";
import { formatLetterDate } from "./letter-date";
import {
    ensureSpace,
    renderBlocks,
    type RenderContext,
} from "./render-blocks";

type TemplateOverview = {
    title?: string;
    to_name?: string;
    to_address?: string;
    from_name?: string;
    from_address?: string;
    salutation?: string;
    body_html?: string;
    closing?: string;
    signature_name?: string;
    signature_title?: string;
};

export type LetterPdfParams = {
    template: TemplateOverview;
    /** Overrides the template's default recipient at send-time. */
    to_name?: string;
    to_address?: string;
    /** Unix timestamp in ms. Defaults to now. */
    letter_date?: number;
    company?: CompanyLetterhead;
};

const BODY_SIZE = 11;
const BODY_LINE_GAP = 15.5;

export default async function generateLetterPdf({
    template,
    to_name,
    to_address,
    letter_date,
    company,
}: LetterPdfParams): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const fonts = await embedPdfFonts(pdfDoc);
    const logo = await embedBrandLogo(pdfDoc);
    const company_block = {
        ...CompanyLetterheadDefaults,
        ...(company || {}),
    };

    let page = pdfDoc.addPage([PdfPageWidth, PdfPageHeight]);
    const ctx: RenderContext = {
        pdfDoc,
        page,
        fonts,
        y: drawBrandHeader({
            page,
            fonts,
            options: { logo, ...company_block },
        }),
    };

    const from_name = template.from_name?.trim();
    const from_address = template.from_address?.trim();

    if (from_name || from_address) {
        ensureSpace(ctx, 80);

        ctx.y += 6;
        drawTextAt(ctx.page, "From:", {
            x: PdfMargin,
            y_from_top: ctx.y,
            size: 9,
            font: fonts.bold,
            color: PdfColors.darkGray,
        });
        ctx.y += 14;

        if (from_name) {
            drawTextAt(ctx.page, from_name, {
                x: PdfMargin,
                y_from_top: ctx.y,
                size: 10.5,
                font: fonts.bold,
                color: PdfColors.black,
            });
            ctx.y += 13.5;
        }

        if (from_address) {
            for (const line of from_address.split(/\r?\n/)) {
                drawTextAt(ctx.page, line, {
                    x: PdfMargin,
                    y_from_top: ctx.y,
                    size: 10.5,
                    font: fonts.regular,
                    color: PdfColors.black,
                });
                ctx.y += 13;
            }
        }

        ctx.y += 10;
    }

    const date_text = formatLetterDate(letter_date || Date.now());

    drawTextAt(ctx.page, date_text, {
        x: PdfPageWidth - PdfMargin,
        y_from_top: ctx.y,
        size: 10.5,
        font: fonts.regular,
        color: PdfColors.black,
        align: "right",
    });
    ctx.y += 24;

    const final_to_name = (to_name || template.to_name || "").trim();
    const final_to_address = (to_address || template.to_address || "")
        .trim();

    if (final_to_name) {
        drawTextAt(ctx.page, final_to_name, {
            x: PdfMargin,
            y_from_top: ctx.y,
            size: 11,
            font: fonts.bold,
            color: PdfColors.black,
        });
        ctx.y += 14.5;
    }

    if (final_to_address) {
        for (const line of final_to_address.split(/\r?\n/)) {
            drawTextAt(ctx.page, line, {
                x: PdfMargin,
                y_from_top: ctx.y,
                size: 10.5,
                font: fonts.regular,
                color: PdfColors.black,
            });
            ctx.y += 13;
        }
    }

    ctx.y += 18;

    const salutation = template.salutation?.trim();

    if (salutation) {
        drawTextAt(ctx.page, salutation, {
            x: PdfMargin,
            y_from_top: ctx.y,
            size: BODY_SIZE,
            font: fonts.regular,
            color: PdfColors.black,
        });
        ctx.y += BODY_LINE_GAP + 6;
    }

    const blocks = htmlToTextBlocks(template.body_html);

    if (blocks[0]) {
        renderBlocks({ blocks, fonts, ctx });
    }

    const closing = template.closing?.trim();
    const signature_name = template.signature_name?.trim();
    const signature_title = template.signature_title?.trim();

    if (closing || signature_name) {
        ensureSpace(ctx, 120);

        ctx.y += 28;

        if (closing) {
            drawTextAt(ctx.page, closing, {
                x: PdfMargin,
                y_from_top: ctx.y,
                size: BODY_SIZE,
                font: fonts.regular,
                color: PdfColors.black,
            });
            ctx.y += 30;
        }

        if (signature_name) {
            drawTextAt(ctx.page, signature_name, {
                x: PdfMargin,
                y_from_top: ctx.y,
                size: 11.5,
                font: fonts.bold,
                color: PdfColors.black,
            });
            ctx.y += 15;
        }

        if (signature_title) {
            drawTextAt(ctx.page, signature_title, {
                x: PdfMargin,
                y_from_top: ctx.y,
                size: 9.5,
                font: fonts.regular,
                color: PdfColors.gray,
            });
            ctx.y += 13;
        }
    }

    drawBrandFooterOnAllPages({
        pdfDoc,
        fonts,
        options: { ...company_block },
    });

    return await pdfDoc.save();
}