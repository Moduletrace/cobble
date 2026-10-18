/**
 * # Format a kobo (₦/100) amount as a Naira currency string.
 * @example formatNaira(150050) // "₦1,500.50"
 */
export function formatNaira(kobo: number | string | undefined | null): string {
    const amount = Math.round(Number(kobo || 0));
    const negative = amount < 0;
    const absolute = Math.abs(amount);

    const whole = Math.floor(absolute / 100);
    const fraction = String(absolute % 100).padStart(2, "0");

    const digits = String(whole);
    let grouped = "";

    for (let i = digits.length - 1, c = 0; i >= 0; i--, c++) {
        if (c > 0 && c % 3 == 0) {
            grouped = `,${grouped}`;
        }
        grouped = digits[i] + grouped;
    }

    return `${negative ? "-" : ""}₦${grouped}.${fraction}`;
}

/**
 * # Format a kobo amount with an ISO currency prefix.
 * Standard PDF fonts (WinAnsi) cannot encode the ₦ glyph,
 * so PDFs use "NGN" instead of "₦".
 * @example formatNairaPdf(150050) // "NGN 1,500.50"
 */
export function formatNairaPdf(
    kobo: number | string | undefined | null,
): string {
    const amount = Math.round(Number(kobo || 0));
    const negative = amount < 0;
    const absolute = Math.abs(amount);

    const whole = Math.floor(absolute / 100);
    const fraction = String(absolute % 100).padStart(2, "0");

    const digits = String(whole);
    let grouped = "";

    for (let i = digits.length - 1, c = 0; i >= 0; i--, c++) {
        if (c > 0 && c % 3 == 0) {
            grouped = `,${grouped}`;
        }
        grouped = digits[i] + grouped;
    }

    return `${negative ? "-" : ""}NGN ${grouped}.${fraction}`;
}

/**
 * # Convert a Naira string/number to kobo (smallest unit).
 * @example nairaToKobo("₦1,500.50") // 150050
 */
export function nairaToKobo(value: string | number | undefined): number {
    const cleaned = String(value || 0).replace(/[^0-9.]/g, "");
    return Math.round((Number(cleaned) || 0) * 100);
}

/**
 * # Convert a kobo amount to a plain Naira string for form inputs.
 * @example koboToNairaString(150050) // "1500.5"
 */
export function koboToNairaString(
    kobo: number | string | undefined | null,
): string {
    const amount = Math.abs(Number(kobo || 0));
    const naira = amount / 100;
    return String(Math.round(naira * 100) / 100);
}

export type InvoiceItemAmountInput = {
    quantity?: number | string | "";
    unit_price_kobo?: number | string | "";
};

/**
 * # Sum line items into a kobo total.
 */
export function sumInvoiceItemsKobo(
    items: InvoiceItemAmountInput[],
): number {
    return items.reduce((acc, item) => {
        const quantity = Number(item.quantity) || 0;
        const unit_price = Number(item.unit_price_kobo) || 0;
        return acc + quantity * unit_price;
    }, 0);
}