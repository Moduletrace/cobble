import { describe, expect, test } from "bun:test";
import formatTokens from "./format-tokens";

describe("formatTokens", () => {
    test("counts under a thousand are exact", () => {
        expect(formatTokens({ tokens: 0 })).toBe("0");
        expect(formatTokens({ tokens: 842 })).toBe("842");
        expect(formatTokens({ tokens: 999 })).toBe("999");
    });

    test("counts under ten thousand keep a decimal, without a trailing zero", () => {
        expect(formatTokens({ tokens: 1000 })).toBe("1K");
        expect(formatTokens({ tokens: 1240 })).toBe("1.2K");
        expect(formatTokens({ tokens: 1240.7 })).toBe("1.2K");
        expect(formatTokens({ tokens: 9999 })).toBe("10K");
    });

    test("counts under a million are whole thousands", () => {
        expect(formatTokens({ tokens: 12_400 })).toBe("12K");
        expect(formatTokens({ tokens: 841_600 })).toBe("842K");
        expect(formatTokens({ tokens: 999_999 })).toBe("1000K");
    });

    test("counts past a million are millions", () => {
        expect(formatTokens({ tokens: 1_000_000 })).toBe("1M");
        expect(formatTokens({ tokens: 1_240_000 })).toBe("1.2M");
        expect(formatTokens({ tokens: 24_800_000 })).toBe("24.8M");
    });

    test("a missing count reads as nothing spent", () => {
        expect(formatTokens({ tokens: null })).toBe("0");
        expect(formatTokens({ tokens: undefined })).toBe("0");
        expect(formatTokens({ tokens: Number.NaN })).toBe("0");
    });
});
