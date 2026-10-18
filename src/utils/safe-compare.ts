import { createHash, timingSafeEqual } from "node:crypto";

export function safeCompare(a: string, b: string): boolean {
    const ah = createHash("sha256").update(a).digest();
    const bh = createHash("sha256").update(b).digest();
    return timingSafeEqual(ah, bh);
}