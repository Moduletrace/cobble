import { PDFDocument, type PDFPage } from "pdf-lib";
import {
    CompanyLetterheadDefaults,
    type CompanyLetterhead,
} from "@/src/dict/company-dict";
import { formatNairaPdf, sumInvoiceItemsKobo } from "@/src/utils/money";
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
    wrapTextToWidth,
    type PdfColor,
    type PdfFonts,
} from "./pdf-helpers";
import { formatInvoiceDate } from "./letter-date";
import htmlToTextBlocks from "./html-blocks";
import {
    NotesBlockStyle,
    renderBlocks,
    type RenderContext,
} from "./render-blocks";
import textToSafeHtml from "@/src/utils/text-to-html";

type InvoiceOverview = {
    invoice_number?: string;
    client_name?: string;
    client_email?: string;
    client_address?: string;
    issue_date?: number | "";
    due_date?: number | "";
    valid_until?: number | "";
    status?: string;
    notes?: string;
};

export type InvoiceItemOverview = {
    description?: string;
    quantity?: number | string | "";
    unit_price_kobo?: number | string | "";
};

export type InvoicePdfParams = {
    invoice: InvoiceOverview;
    items: InvoiceItemOverview[];
    company?: CompanyLetterhead;
    kind?: "invoice" | "quote";
};

const FOOTER_SPACE = 140;

const COLUMNS = {
    index: { x: PdfMargin, width: 30 },
    description: { x: PdfMargin + 30, width: 213 },
    quantity: { x: PdfMargin + 243, width: 46 },
    unit_price: { x: PdfMargin + 299, width: 70 },
    amount: { x: PdfMargin + 379, width: 120 },
};

function columnRightEdge(column: { x: number; width: number }) {
    return column.x + column.width;
}

function drawItemsTable({
    pdfDoc,
    page,
    fonts,
    items,
    start_y,
}: {
    pdfDoc: PDFDocument;
    page: PDFPage;
    fonts: PdfFonts;
    items: InvoiceItemOverview[];
    start_y: number;
}) {
    const header_height = 24;
    const table_right = page.getWidth() - PdfMargin;
    const content_bottom = PdfPageHeight - FOOTER_SPACE;

    let current_page = page;
    let y = start_y;

    const drawRowFill = (height: number, color: PdfColor) => {
        current_page.drawRectangle({
            x: PdfMargin,
            y: current_page.getHeight() - y - height,
            width: table_right - PdfMargin,
            height,
            color,
        });
    };

    const drawCellText = (
        text: string,
        column: { x: number; width: number },
        size: number,
        font: PdfFonts[keyof PdfFonts],
        color: PdfColor,
        align: "left" | "right",
        cell_top: number,
    ) => {
        const final_x =
            align == "right" ? columnRightEdge(column) : column.x + 6;
        drawTextAt(current_page, text, {
            x: final_x,
            y_from_top: cell_top + 8,
            size,
            font,
            color,
            max_width: align == "right" ? column.width : column.width - 12,
            align,
        });
    };

    const drawHeaderRow = () => {
        drawRowFill(header_height, PdfColors.black);
        drawCellText(
            "#",
            COLUMNS.index,
            9.5,
            fonts.bold,
            PdfColors.white,
            "left",
            y,
        );
        drawCellText(
            "Description",
            COLUMNS.description,
            9.5,
            fonts.bold,
            PdfColors.white,
            "left",
            y,
        );
        drawCellText(
            "Qty",
            COLUMNS.quantity,
            9.5,
            fonts.bold,
            PdfColors.white,
            "right",
            y,
        );
        drawCellText(
            "Unit Price",
            COLUMNS.unit_price,
            9.5,
            fonts.bold,
            PdfColors.white,
            "right",
            y,
        );
        drawCellText(
            "Amount",
            COLUMNS.amount,
            9.5,
            fonts.bold,
            PdfColors.white,
            "right",
            y,
        );
        y += header_height;
    };

    const beginFreshPage = () => {
        const new_page = pdfDoc.addPage([PdfPageWidth, PdfPageHeight]);
        current_page = new_page;
        y = drawBrandHeader({ page: new_page, fonts }) + 10;
        drawHeaderRow();
    };

    if (y + header_height > content_bottom) {
        beginFreshPage();
    } else {
        drawHeaderRow();
    }

    if (!items?.[0]) {
        if (y + 34 > content_bottom) {
            beginFreshPage();
        }
        drawRowFill(34, PdfColors.lightGray);
        drawCellText(
            "No items",
            COLUMNS.description,
            9.5,
            fonts.regular,
            PdfColors.gray,
            "left",
            y,
        );
        y += 34;
        return { page: current_page, y };
    }

    for (const [index, item] of items.entries()) {
        const quantity = Number(item.quantity) || 0;
        const unit_price = Number(item.unit_price_kobo) || 0;
        const amount = quantity * unit_price;

        const description_lines = wrapTextToWidth(
            (item.description || "").trim(),
            fonts.regular,
            9,
            COLUMNS.description.width - 12,
        );

        const row_height = Math.max(
            27,
            description_lines.reduce((acc) => acc + 12, 6),
        );

        if (y + row_height > content_bottom) {
            beginFreshPage();
        }

        drawRowFill(
            row_height,
            index % 2 == 0 ? PdfColors.lightGray : PdfColors.white,
        );

        drawCellText(
            String(index + 1),
            COLUMNS.index,
            9.5,
            fonts.regular,
            PdfColors.darkGray,
            "left",
            y,
        );

        for (const [line_index, line] of description_lines.entries()) {
            drawTextAt(current_page, line, {
                x: COLUMNS.description.x + 6,
                y_from_top: y + 8 + line_index * 12,
                size: 9.5,
                font: fonts.regular,
                color: PdfColors.darkGray,
            });
        }

        drawCellText(
            String(quantity),
            COLUMNS.quantity,
            9.5,
            fonts.regular,
            PdfColors.darkGray,
            "right",
            y,
        );
        drawCellText(
            formatNairaPdf(unit_price),
            COLUMNS.unit_price,
            9.5,
            fonts.regular,
            PdfColors.darkGray,
            "right",
            y,
        );
        drawCellText(
            formatNairaPdf(amount),
            COLUMNS.amount,
            9.5,
            fonts.bold,
            PdfColors.darkGray,
            "right",
            y,
        );

        y += row_height;
    }

    return { page: current_page, y };
}

function drawTotalsBlock({
    pdfDoc,
    page,
    fonts,
    items,
    start_y,
}: {
    pdfDoc: PDFDocument;
    page: PDFPage;
    fonts: PdfFonts;
    items: InvoiceItemOverview[];
    start_y: number;
}) {
    const total_kobo = sumInvoiceItemsKobo(items);
    const totals_x = PdfPageWidth - PdfMargin - 220;
    const value_x = PdfPageWidth - PdfMargin;

    let current_page = page;
    let y = start_y + 12;

    if (y + 90 > PdfPageHeight - FOOTER_SPACE) {
        current_page = pdfDoc.addPage([PdfPageWidth, PdfPageHeight]);
        y = drawBrandHeader({ page: current_page, fonts }) + 10;
    }

    const drawTotalRow = (label: string, value: string, bold: boolean) => {
        const size = bold ? 11 : 10;
        const font = bold ? fonts.bold : fonts.regular;
        const color = bold ? PdfColors.black : PdfColors.darkGray;

        if (bold) {
            current_page.drawRectangle({
                x: totals_x,
                y: current_page.getHeight() - y - 2,
                width: value_x - totals_x,
                height: 1.2,
                color: PdfColors.gray,
            });
            y += 5;
        }

        drawTextAt(current_page, label, {
            x: totals_x,
            y_from_top: y,
            size,
            font,
            color: PdfColors.darkGray,
        });
        drawTextAt(current_page, value, {
            x: value_x,
            y_from_top: y,
            size,
            font,
            color,
            max_width: 220,
            align: "right",
        });

        y += bold ? 20 : 17;
    };

    drawTotalRow("Subtotal", formatNairaPdf(total_kobo), false);
    drawTotalRow("Total (NGN)", formatNairaPdf(total_kobo), true);

    return { page: current_page, y };
}

export default async function generateInvoicePdf({
    invoice,
    items,
    company,
    kind = "invoice",
}: InvoicePdfParams): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const fonts = await embedPdfFonts(pdfDoc);
    const logo = await embedBrandLogo(pdfDoc);
    const company_block = {
        ...CompanyLetterheadDefaults,
        ...(company || {}),
    };
    const is_quote = kind == "quote";
    const document_title = is_quote ? "QUOTATION" : "INVOICE";
    const bill_to_label = is_quote ? "PREPARED FOR" : "BILL TO";

    let page = pdfDoc.addPage([PdfPageWidth, PdfPageHeight]);

    let y = drawBrandHeader({
        page,
        fonts,
        options: { logo, ...company_block },
    });

    const fitOnFreshPage = (height: number) => {
        if (y + height <= PdfPageHeight - FOOTER_SPACE) {
            return;
        }

        page = pdfDoc.addPage([PdfPageWidth, PdfPageHeight]);
        y = drawBrandHeader({ page, fonts }) + 10;
    };

    // Title + meta block
    y += 10;
    drawTextAt(page, document_title, {
        x: PdfMargin,
        y_from_top: y,
        size: 22,
        font: fonts.bold,
        color: PdfColors.black,
    });

    const meta_lines: { text: string; bold?: boolean }[] = [
        {
            text: invoice.invoice_number || "",
            bold: true,
        },
        {
            text: `Issued: ${formatInvoiceDate(invoice.issue_date || Date.now())}`,
        },
        is_quote
            ? { text: `Valid Until: ${formatInvoiceDate(invoice.valid_until)}` }
            : { text: `Due: ${formatInvoiceDate(invoice.due_date)}` },
    ];

    let meta_y = y + 4;

    for (const meta_line of meta_lines) {
        drawTextAt(page, meta_line.text, {
            x: PdfPageWidth - PdfMargin,
            y_from_top: meta_y,
            size: meta_line.bold ? 12 : 9,
            font: meta_line.bold ? fonts.bold : fonts.regular,
            color: meta_line.bold ? PdfColors.black : PdfColors.darkGray,
            max_width: 200,
            align: "right",
        });
        meta_y += meta_line.bold ? 15 : 11;
    }

    const status = String(invoice.status || "draft").toLowerCase();
    const status_colors: Record<string, PdfColor> = {
        draft: PdfColors.gray,
        issued: PdfColors.accent,
        paid: PdfColors.success,
        cancelled: PdfColors.error,
        sent: PdfColors.accent,
        accepted: PdfColors.success,
        declined: PdfColors.error,
        expired: PdfColors.gray,
    };
    const status_color = status_colors[status] || PdfColors.gray;

    drawTextAt(page, status.toUpperCase(), {
        x: PdfPageWidth - PdfMargin,
        y_from_top: meta_y,
        size: 9.5,
        font: fonts.bold,
        color: status_color,
        max_width: 90,
        align: "right",
    });

    y = meta_y + 24;

    // Bill To block
    const client_name = invoice.client_name?.trim();
    const client_address = invoice.client_address?.trim();
    const client_email = invoice.client_email?.trim();

    if (client_name || client_address || client_email) {
        drawTextAt(page, bill_to_label, {
            x: PdfMargin,
            y_from_top: y,
            size: 9,
            font: fonts.bold,
            color: PdfColors.darkGray,
        });
        y += 14;

        if (client_name) {
            drawTextAt(page, client_name, {
                x: PdfMargin,
                y_from_top: y,
                size: 11,
                font: fonts.bold,
                color: PdfColors.black,
            });
            y += 14;
        }

        if (client_address) {
            for (const line of client_address.split(/\r?\n/)) {
                drawTextAt(page, line, {
                    x: PdfMargin,
                    y_from_top: y,
                    size: 10,
                    font: fonts.regular,
                    color: PdfColors.darkGray,
                    max_width: 300,
                });
                y += 12.5;
            }
        }

        if (client_email) {
            y += 1;
            drawTextAt(page, client_email, {
                x: PdfMargin,
                y_from_top: y,
                size: 10,
                font: fonts.regular,
                color: PdfColors.accent,
                max_width: 300,
            });
            y += 13;
        }

        y += 10;
    }

    // Items table
    fitOnFreshPage(160);

    const table_result = drawItemsTable({
        pdfDoc,
        page,
        fonts,
        items,
        start_y: y,
    });
    page = table_result.page;
    y = table_result.y;

    const totals_result = drawTotalsBlock({
        pdfDoc,
        page,
        fonts,
        items,
        start_y: y,
    });
    page = totals_result.page;
    y = totals_result.y;

    if (invoice.notes?.trim()) {
        fitOnFreshPage(50);

        y += 16;
        drawTextAt(page, "NOTES", {
            x: PdfMargin,
            y_from_top: y,
            size: 9,
            font: fonts.bold,
            color: PdfColors.darkGray,
        });
        y += 13;

        const blocks = htmlToTextBlocks(textToSafeHtml(invoice.notes));

        if (blocks[0]) {
            const notes_ctx: RenderContext = {
                pdfDoc,
                page,
                y,
                fonts,
            };

            const notes_res = renderBlocks({
                blocks,
                fonts,
                ctx: notes_ctx,
                style: NotesBlockStyle,
            });

            page = notes_res.page;
            y = notes_res.y + 6;
        }
    }

    if (
        !is_quote &&
        (company_block.bank_name || company_block.ngn_acc_number)
    ) {
        fitOnFreshPage(70);

        y += 16;
        drawTextAt(page, "ACCOUNT DETAILS", {
            x: PdfMargin,
            y_from_top: y,
            size: 9,
            font: fonts.bold,
            color: PdfColors.darkGray,
        });
        y += 13;

        if (company_block.bank_name) {
            drawTextAt(page, `Bank: ${company_block.bank_name}`, {
                x: PdfMargin,
                y_from_top: y,
                size: 9.5,
                font: fonts.regular,
                color: PdfColors.darkGray,
            });
            y += 12.5;
        }

        if (company_block.ngn_acc_number) {
            drawTextAt(page, `Acc. No.: ${company_block.ngn_acc_number}`, {
                x: PdfMargin,
                y_from_top: y,
                size: 9.5,
                font: fonts.regular,
                color: PdfColors.darkGray,
            });
            y += 12.5;
        }
    }

    drawBrandFooterOnAllPages({
        pdfDoc,
        fonts,
        options: { ...company_block },
    });

    return await pdfDoc.save();
}
