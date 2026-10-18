import { formatInvoiceDate } from "@/src/functions/backend/pdf/letter-date";
import { CompanyLetterheadDefaults } from "@/src/dict/company-dict";
import { formatNaira } from "@/src/utils/money";
import { ThemeColors } from "@/src/functions/backend/theme/theme-colors";

const letter_divider = (
    <hr
        style={{
            border: "none",
            borderTop: `1px solid ${ThemeColors.hairline}`,
        }}
    />
);

type InvoiceEmailContentProps = {
    invoice: {
        invoice_number?: string;
        client_name?: string;
        issue_date?: number | "";
        due_date?: number | "";
        status?: string;
        notes?: string;
    };
    items: {
        description?: string;
        quantity?: number | string | "";
        unit_price_kobo?: number | string | "";
    }[];
};

type QuoteEmailContentProps = {
    quote: {
        quote_number?: string;
        client_name?: string;
        issue_date?: number | "";
        valid_until?: number | "";
        status?: string;
        notes?: string;
    };
    items: {
        description?: string;
        quantity?: number | string | "";
        unit_price_kobo?: number | string | "";
    }[];
};

export function InvoiceEmailContent({
    invoice,
    items,
}: InvoiceEmailContentProps) {
    const total_kobo = items.reduce((acc, item) => {
        return (
            acc +
            (Number(item.quantity) || 0) * (Number(item.unit_price_kobo) || 0)
        );
    }, 0);

    return (
        <div>
            <div
                style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    color: ThemeColors.ink,
                }}
            >
                {CompanyLetterheadDefaults.name}
            </div>
            {letter_divider}

            <h1
                style={{
                    fontSize: "18px",
                    margin: "0 0 6px",
                }}
            >
                Invoice {invoice.invoice_number || ""}
            </h1>

            <div
                style={{
                    fontSize: "13px",
                    lineHeight: "1.7",
                    color: ThemeColors.body,
                }}
            >
                Hello {invoice.client_name || "there"},
                <br />
                Please find attached invoice {invoice.invoice_number || ""} for
                your records.
            </div>

            {letter_divider}

            <div style={{ fontSize: "14px", lineHeight: "1.6" }}>
                <table
                    width="100%"
                    cellPadding="0"
                    cellSpacing="0"
                    style={{ fontSize: "13px", borderCollapse: "collapse" }}
                >
                    <tr
                        style={{
                            background: ThemeColors.ink,
                            color: ThemeColors.surface,
                            fontWeight: "600",
                        }}
                    >
                        <td style={{ padding: "8px 10px" }}>Description</td>
                        <td align="right" style={{ padding: "8px 10px" }}>
                            Qty
                        </td>
                        <td align="right" style={{ padding: "8px 10px" }}>
                            Amount
                        </td>
                    </tr>
                    {items.map((item, index) => (
                        <tr
                            key={index}
                            style={
                                index % 2 == 0
                                    ? { background: ThemeColors.faint }
                                    : undefined
                            }
                        >
                            <td style={{ padding: "7px 10px" }}>
                                {item.description}
                            </td>
                            <td align="right" style={{ padding: "7px 10px" }}>
                                {Number(item.quantity) || 0}
                            </td>
                            <td align="right" style={{ padding: "7px 10px" }}>
                                {formatNaira(
                                    (Number(item.quantity) || 0) *
                                        (Number(item.unit_price_kobo) || 0),
                                )}
                            </td>
                        </tr>
                    ))}
                    <tr>
                        <td
                            colSpan={2}
                            align="right"
                            style={{
                                padding: "9px 10px",
                                fontWeight: "600",
                            }}
                        >
                            Total (NGN)
                        </td>
                        <td
                            align="right"
                            style={{
                                padding: "9px 10px",
                                fontWeight: "600",
                            }}
                        >
                            {formatNaira(total_kobo)}
                        </td>
                    </tr>
                </table>
            </div>

            {letter_divider}

            <div
                style={{
                    fontSize: "13px",
                    lineHeight: "1.7",
                    color: ThemeColors.body,
                }}
            >
                Invoice {invoice.invoice_number || ""} was issued on{" "}
                {formatInvoiceDate(invoice.issue_date || Date.now())}
                {invoice.due_date
                    ? ` and is due by ${formatInvoiceDate(invoice.due_date)}`
                    : ""}
                .
                <br />
                <br />
                Thank you for your business.
            </div>

            <div
                style={{
                    fontSize: "12px",
                    color: ThemeColors.muted,
                    borderTop: `1px solid ${ThemeColors.hairline}`,
                    paddingTop: "12px",
                }}
            >
                {CompanyLetterheadDefaults.name} -{" "}
                {CompanyLetterheadDefaults.address_lines.join(", ")} |{" "}
                {CompanyLetterheadDefaults.phone} |{" "}
                {CompanyLetterheadDefaults.email} |{" "}
                {CompanyLetterheadDefaults.website}
            </div>
        </div>
    );
}
export function QuoteEmailContent({ quote, items }: QuoteEmailContentProps) {
    const total_kobo = items.reduce((acc, item) => {
        return (
            acc +
            (Number(item.quantity) || 0) * (Number(item.unit_price_kobo) || 0)
        );
    }, 0);

    return (
        <div>
            <div
                style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    color: ThemeColors.ink,
                }}
            >
                {CompanyLetterheadDefaults.name}
            </div>
            {letter_divider}

            <h1
                style={{
                    fontSize: "18px",
                    margin: "0 0 6px",
                }}
            >
                Quotation {quote.quote_number || ""}
            </h1>

            <div
                style={{
                    fontSize: "13px",
                    lineHeight: "1.7",
                    color: ThemeColors.body,
                }}
            >
                Hello {quote.client_name || "there"},
                <br />
                Please find attached quotation {quote.quote_number || ""} for
                our proposed works.
            </div>

            {letter_divider}

            <div style={{ fontSize: "14px", lineHeight: "1.6" }}>
                <table
                    width="100%"
                    cellPadding="0"
                    cellSpacing="0"
                    style={{ fontSize: "13px", borderCollapse: "collapse" }}
                >
                    <tr
                        style={{
                            background: ThemeColors.ink,
                            color: ThemeColors.surface,
                            fontWeight: "600",
                        }}
                    >
                        <td style={{ padding: "8px 10px" }}>Description</td>
                        <td align="right" style={{ padding: "8px 10px" }}>
                            Qty
                        </td>
                        <td align="right" style={{ padding: "8px 10px" }}>
                            Amount
                        </td>
                    </tr>
                    {items.map((item, index) => (
                        <tr
                            key={index}
                            style={
                                index % 2 == 0
                                    ? { background: ThemeColors.faint }
                                    : undefined
                            }
                        >
                            <td style={{ padding: "7px 10px" }}>
                                {item.description}
                            </td>
                            <td align="right" style={{ padding: "7px 10px" }}>
                                {Number(item.quantity) || 0}
                            </td>
                            <td align="right" style={{ padding: "7px 10px" }}>
                                {formatNaira(
                                    (Number(item.quantity) || 0) *
                                        (Number(item.unit_price_kobo) || 0),
                                )}
                            </td>
                        </tr>
                    ))}
                    <tr>
                        <td
                            colSpan={2}
                            align="right"
                            style={{
                                padding: "9px 10px",
                                fontWeight: "600",
                            }}
                        >
                            Total (NGN)
                        </td>
                        <td
                            align="right"
                            style={{
                                padding: "9px 10px",
                                fontWeight: "600",
                            }}
                        >
                            {formatNaira(total_kobo)}
                        </td>
                    </tr>
                </table>
            </div>

            {letter_divider}

            <div
                style={{
                    fontSize: "13px",
                    lineHeight: "1.7",
                    color: ThemeColors.body,
                }}
            >
                Quotation {quote.quote_number || ""} was issued on{" "}
                {formatInvoiceDate(quote.issue_date || Date.now())}
                {quote.valid_until
                    ? ` and is valid until ${formatInvoiceDate(quote.valid_until)}`
                    : ""}
                .
                <br />
                <br />
                We look forward to working with you.
            </div>

            <div
                style={{
                    fontSize: "12px",
                    color: ThemeColors.muted,
                    borderTop: `1px solid ${ThemeColors.hairline}`,
                    paddingTop: "12px",
                }}
            >
                {CompanyLetterheadDefaults.name} -{" "}
                {CompanyLetterheadDefaults.address_lines.join(", ")} |{" "}
                {CompanyLetterheadDefaults.phone} |{" "}
                {CompanyLetterheadDefaults.email} |{" "}
                {CompanyLetterheadDefaults.website}
            </div>
        </div>
    );
}
