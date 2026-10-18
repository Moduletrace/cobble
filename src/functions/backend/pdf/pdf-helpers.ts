import path from "path";
import type { PDFDocument, PDFFont, PDFImage, PDFPage } from "pdf-lib";
import sharp from "sharp";
import { StandardFonts, rgb } from "pdf-lib";
import { CompanyLetterheadDefaults } from "@/src/dict/company-dict";
import { ThemeColors } from "@/src/functions/backend/theme/theme-colors";
import hexToRgbFractions from "@/src/utils/hex-to-rgb-fractions";

function themePdfColor({ hex }: { hex: string }) {
    const { r, g, b } = hexToRgbFractions({ hex });
    return rgb(r, g, b);
}

export const PdfColors = {
    black: themePdfColor({ hex: ThemeColors.ink }),
    darkGray: themePdfColor({ hex: ThemeColors.body }),
    gray: themePdfColor({ hex: ThemeColors.muted }),
    lightGray: themePdfColor({ hex: ThemeColors.subtle }),
    white: themePdfColor({ hex: ThemeColors.surface }),
    accent: themePdfColor({ hex: ThemeColors.accent }),
    success: rgb(10 / 255, 161 / 255, 86 / 255),
    error: rgb(229 / 255, 72 / 255, 77 / 255),
} as const;

export type PdfColor = ReturnType<typeof rgb>;

export type PdfFonts = {
    regular: PDFFont;
    bold: PDFFont;
    italic: PDFFont;
    boldItalic: PDFFont;
};

export const PdfPageWidth = 595.28;
export const PdfPageHeight = 841.89;
export const PdfMargin = 48;

export async function embedPdfFonts(pdfDoc: PDFDocument): Promise<PdfFonts> {
    return {
        regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
        bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
        italic: await pdfDoc.embedFont(StandardFonts.HelveticaOblique),
        boldItalic: await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique),
    };
}

export async function embedBrandLogo(
    pdfDoc: PDFDocument,
): Promise<PDFImage | undefined> {
    try {
        const logo_location = path.join(
            process.cwd(),
            "public/logos/logo.png",
        );
        const logo_file = Bun.file(logo_location);

        if (!(await logo_file.exists())) {
            return undefined;
        }

        const logo_buffer = Buffer.from(await logo_file.arrayBuffer());

        const resized_buffer = await sharp(logo_buffer)
            .resize(240, 240, {
                fit: "inside",
                withoutEnlargement: true,
            })
            .png()
            .toBuffer();

        return await pdfDoc.embedPng(new Uint8Array(resized_buffer));
    } catch (error: any) {
        return undefined;
    }
}

function pageBaseline(page: PDFPage, y_from_top: number, size: number) {
    return page.getHeight() - y_from_top - size * 0.8;
}

export function drawTextAt(
    page: PDFPage,
    text: string,
    {
        x,
        y_from_top,
        size,
        font,
        color = PdfColors.black,
        max_width,
        align = "left",
    }: {
        x: number;
        y_from_top: number;
        size: number;
        font: PDFFont;
        color?: ReturnType<typeof rgb>;
        max_width?: number;
        align?: "left" | "right" | "center";
    },
) {
    if (max_width !== undefined) {
        text = truncateToWidth(text, font, size, max_width);
    }

    const text_width = font.widthOfTextAtSize(text, size);
    let final_x = x;

    if (align == "right") {
        final_x = x - text_width;
    } else if (align == "center") {
        final_x = x - text_width / 2;
    }

    const y = pageBaseline(page, y_from_top, size);

    return page.drawText(text, {
        x: final_x,
        y,
        size,
        font,
        color,
        maxWidth: max_width,
    });
}

export function truncateToWidth(
    text: string,
    font: PDFFont,
    size: number,
    max_width: number,
) {
    if (font.widthOfTextAtSize(text, size) <= max_width) {
        return text;
    }

    let truncated = text;

    while (
        truncated.length > 1 &&
        font.widthOfTextAtSize(`${truncated}…`, size) > max_width
    ) {
        truncated = truncated.slice(0, -1);
    }

    return `${truncated}…`;
}

export function wrapTextToWidth(
    text: string,
    font: PDFFont,
    size: number,
    max_width: number,
): string[] {
    const words = text.split(/\s+/).filter((w) => w);
    const lines: string[] = [];
    let current = "";

    for (const word of words) {
        const candidate = current ? `${current} ${word}` : word;

        if (font.widthOfTextAtSize(candidate, size) <= max_width || !current) {
            current = candidate;
        } else {
            lines.push(current);
            current = word;
        }
    }

    if (current) {
        lines.push(current);
    }

    if (!lines[0]) {
        lines.push("");
    }

    return lines;
}

export type StyledWord = {
    text: string;
    font: PDFFont;
    underline?: boolean;
};

export type StyledLine = {
    words: StyledWord[];
    width: number;
};

export type StyledSegmentInput = {
    text: string;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
};

/**
 * # Wrap mixed-style segments into lines of styled words.
 */
export function wrapStyledSegments({
    segments,
    fonts,
    size,
    max_width,
    first_line_max_width_override,
}: {
    segments: StyledSegmentInput[];
    fonts: PdfFonts;
    size: number;
    max_width: number;
    first_line_max_width_override?: number;
}): StyledLine[] {
    const words: StyledWord[] = [];

    for (const segment of segments) {
        const segments_words = segment.text.split(/\s+/).filter((w) => w);

        const word_font = segment.bold
            ? segment.italic
                ? fonts.boldItalic
                : fonts.bold
            : segment.italic
              ? fonts.italic
              : fonts.regular;

        for (const word of segments_words) {
            words.push({
                text: word,
                font: word_font,
                underline: segment.underline,
            });
            // Keep spacing between words and between segments.
            words.push({ text: " ", font: word_font });
        }
    }

    const lines: StyledLine[] = [];
    let current_words: StyledWord[] = [];
    let current_width = 0;
    let line_index = 0;

    for (const word of words) {
        const word_width = word.font.widthOfTextAtSize(word.text, size);
        const line_max =
            line_index == 0 && first_line_max_width_override
                ? first_line_max_width_override
                : max_width;

        if (current_words[0] && current_width + word_width > line_max) {
            lines.push({
                words: current_words,
                width: current_width,
            });
            current_words = [word];
            current_width = word_width;
            line_index++;
        } else {
            current_words.push(word);
            current_width += word_width;
        }
    }

    if (current_words[0]) {
        lines.push({ words: current_words, width: current_width });
    }

    return lines;
}

export function drawStyledLine(
    page: PDFPage,
    line: StyledLine,
    {
        x,
        y_from_top,
        size,
        color = PdfColors.black,
    }: {
        x: number;
        y_from_top: number;
        size: number;
        color?: ReturnType<typeof rgb>;
    },
) {
    let cursor_x = x;
    const baseline = pageBaseline(page, y_from_top, size);

    for (const word of line.words) {
        page.drawText(word.text, {
            x: cursor_x,
            y: baseline,
            size,
            font: word.font,
            color,
        });

        if (word.underline) {
            const word_width = word.font.widthOfTextAtSize(word.text, size);
            page.drawRectangle({
                x: cursor_x,
                y: baseline - 1.5,
                width: word_width,
                height: 1,
                color,
            });
        }

        cursor_x += word.font.widthOfTextAtSize(word.text, size);
    }
}

export type BrandHeaderOptions = {
    logo?: PDFImage;
    company_name?: string;
    address_lines?: readonly string[];
    phone?: string;
    email?: string;
    website?: string;
    rc_number?: string;
};

function displayWebsite(url: string) {
    return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function normalizeCompany(options?: BrandHeaderOptions) {
    return {
        company_name: options?.company_name || CompanyLetterheadDefaults.name,
        address_lines: [
            ...(options?.address_lines ||
                CompanyLetterheadDefaults.address_lines),
        ],
        phone: options?.phone || CompanyLetterheadDefaults.phone,
        email: options?.email || CompanyLetterheadDefaults.email,
        website: options?.website || CompanyLetterheadDefaults.website,
        rc_number: options?.rc_number || CompanyLetterheadDefaults.rc_number,
    };
}

/**
 * # Draw the branded letterhead (logo + company block + rule).
 * Returns the y_from_top position where content can start.
 */
export function drawBrandHeader({
    page,
    fonts,
    options,
}: {
    page: PDFPage;
    fonts: PdfFonts;
    options?: BrandHeaderOptions;
}) {
    const company = normalizeCompany(options);

    let y = 56;

    if (options?.logo) {
        const ratio = options.logo.width / options.logo.height;
        const logo_width = 74;
        const logo_height = logo_width / ratio;

        page.drawImage(options.logo, {
            x: PdfMargin,
            y: page.getHeight() - y - logo_height,
            width: logo_width,
            height: logo_height,
        });

        if (logo_height > 32) {
            y = 56 + logo_height - 32;
        }
    }

    const { address_lines, phone, email, website, rc_number, company_name } =
        company;

    const company_block_lines = [
        { text: company_name, size: 13, font: fonts.bold, gap: 16 },
        ...(address_lines || []).map((address_line) => ({
            text: address_line,
            size: 8.5,
            font: fonts.regular,
            gap: 11.5,
        })),
    ];

    const contact_line = [
        phone ? `T: ${phone}` : "",
        email ? `E: ${email}` : "",
    ]
        .filter((part) => part)
        .join("  |  ");

    if (contact_line) {
        company_block_lines.push({
            text: contact_line,
            size: 8.5,
            font: fonts.regular,
            gap: 11.5,
        });
    }

    const meta_line = [
        website ? `W: ${displayWebsite(website)}` : "",
        rc_number ? `RC: ${rc_number}` : "",
    ]
        .filter((part) => part)
        .join("  |  ");

    if (meta_line) {
        company_block_lines.push({
            text: meta_line,
            size: 8.5,
            font: fonts.regular,
            gap: 11.5,
        });
    }

    let block_y = y;

    for (const line of company_block_lines) {
        drawTextAt(page, line.text, {
            x: PdfPageWidth - PdfMargin,
            y_from_top: block_y,
            size: line.size,
            font: line.font,
            color: PdfColors.darkGray,
            max_width: 240,
            align: "right",
        });
        block_y += line.gap;
    }

    const divider_y = Math.max(block_y, y) + 16;

    page.drawRectangle({
        x: PdfMargin,
        y: page.getHeight() - divider_y - 2,
        width: PdfPageWidth - PdfMargin * 2,
        height: 2,
        color: PdfColors.accent,
    });

    return divider_y + 14;
}

/**
 * # Draw the branded footer bar on every page of the document.
 */
export function drawBrandFooterOnAllPages({
    pdfDoc,
    fonts,
    options,
}: {
    pdfDoc: PDFDocument;
    fonts: PdfFonts;
    options?: BrandHeaderOptions;
}) {
    for (const page of pdfDoc.getPages()) {
        drawBrandFooter({ page, fonts, options });
    }
}

/**
 * # Draw the branded footer bar, anchored to the bottom of the page.
 */
export function drawBrandFooter({
    page,
    fonts,
    options,
}: {
    page: PDFPage;
    fonts: PdfFonts;
    options?: BrandHeaderOptions;
}) {
    const company = normalizeCompany(options);

    const band_height = 62;

    page.drawRectangle({
        x: PdfMargin,
        y: band_height,
        width: PdfPageWidth - PdfMargin * 2,
        height: 1,
        color: PdfColors.gray,
    });

    const drawFromBottom = ({
        text,
        size,
        font,
        color,
        align = "left",
        bottom_offset,
    }: {
        text: string;
        size: number;
        font: PDFFont;
        color?: ReturnType<typeof rgb>;
        align?: "left" | "right";
        bottom_offset: number;
    }) => {
        const width = font.widthOfTextAtSize(text, size);
        const x =
            align == "right" ? PdfPageWidth - PdfMargin - width : PdfMargin;

        return page.drawText(text, {
            x,
            y: bottom_offset + size * 0.8,
            size,
            font,
            color,
        });
    };

    const contact_line = [
        company.phone ? `T: ${company.phone}` : "",
        company.email ? `E: ${company.email}` : "",
        company.website ? `W: ${displayWebsite(company.website)}` : "",
        company.rc_number ? `RC: ${company.rc_number}` : "",
    ]
        .filter((part) => part)
        .join("  |  ");

    const address_text = company.address_lines.join("  •  ");

    const address_lines_wrapped = wrapTextToWidth(
        address_text,
        fonts.regular,
        8,
        PdfPageWidth - PdfMargin * 2,
    );

    let bottom = 14;

    if (contact_line) {
        drawFromBottom({
            text: contact_line,
            size: 8,
            font: fonts.regular,
            color: PdfColors.gray,
            bottom_offset: bottom,
        });
        bottom += 11;
    }

    for (const address_line of address_lines_wrapped.reverse()) {
        drawFromBottom({
            text: address_line,
            size: 8,
            font: fonts.regular,
            color: PdfColors.gray,
            bottom_offset: bottom,
        });
        bottom += 10.5;
    }

    drawFromBottom({
        text: company.company_name.toUpperCase(),
        size: 8,
        font: fonts.bold,
        color: PdfColors.gray,
        align: "right",
        bottom_offset: band_height - 13,
    });
}
