import { expect, test } from "bun:test";
import {
    formatNaira,
    nairaToKobo,
    sumInvoiceItemsKobo,
} from "./money";

test("formatNaira formats kobo amounts", () => {
    expect(formatNaira(150050)).toBe("₦1,500.50");
    expect(formatNaira(100)).toBe("₦1.00");
    expect(formatNaira(0)).toBe("₦0.00");
    expect(formatNaira(500000000)).toBe("₦5,000,000.00");
    expect(formatNaira(1)).toBe("₦0.01");
    expect(formatNaira("250000")).toBe("₦2,500.00");
});

test("formatNaira handles strings, undefined and negative", () => {
    expect(formatNaira(undefined)).toBe("₦0.00");
    expect(formatNaira(null)).toBe("₦0.00");
    expect(formatNaira(1000)).toBe("₦10.00");
    expect(formatNaira(-5050)).toBe("-₦50.50");
});

test("nairaToKobo parses naira strings", () => {
    expect(nairaToKobo("₦1,500.50")).toBe(150050);
    expect(nairaToKobo("1500")).toBe(150000);
    expect(nairaToKobo("1,234.56")).toBe(123456);
    expect(nairaToKobo(undefined)).toBe(0);
    expect(nairaToKobo("")).toBe(0);
    expect(nairaToKobo("abc")).toBe(0);
});

test("sumInvoiceItemsKobo totals line items", () => {
    const items = [
        { quantity: 2, unit_price_kobo: 5000 }, // ₦50.00 x2
        { quantity: 1, unit_price_kobo: 150000 }, // ₦1,500.00
        { quantity: "", unit_price_kobo: "" },
    ];

    expect(sumInvoiceItemsKobo(items)).toBe(160000);
    expect(sumInvoiceItemsKobo([])).toBe(0);
});