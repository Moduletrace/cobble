import dayjs from "dayjs";

function ordinal(n: number): string {
    const mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 13) {
        return "th";
    }
    switch (n % 10) {
        case 1:
            return "st";
        case 2:
            return "nd";
        case 3:
            return "rd";
        default:
            return "th";
    }
}

/**
 * # Format a timestamp as a letter date, e.g. "22nd September, 2026".
 */
export function formatLetterDate(timestamp: number): string {
    const date = dayjs(timestamp);
    return `${date.date()}${ordinal(date.date())} ${date.format("MMMM, YYYY")}`;
}

/**
 * # Format a timestamp as a short invoice date, e.g. "22 Sep 2026".
 */
export function formatInvoiceDate(
    timestamp?: number | string | "",
): string {
    if (!timestamp) {
        return "\u2014";
    }
    return dayjs(Number(timestamp)).format("DD MMM YYYY");
}