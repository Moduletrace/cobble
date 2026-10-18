import { expect, test } from "bun:test";
import formatBytes from "./format-bytes";

test("formatBytes formats sizes", () => {
    expect(formatBytes({ bytes: 0 })).toBe("0 B");
    expect(formatBytes({ bytes: 512 })).toBe("512 B");
    expect(formatBytes({ bytes: 12449 })).toBe("12.2 KB");
    expect(formatBytes({ bytes: 5 * 1024 * 1024 })).toBe("5.0 MB");
    expect(formatBytes({ bytes: NaN })).toBe("0 B");
});
