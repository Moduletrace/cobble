import { createHmac, timingSafeEqual } from "node:crypto";
import type { BotHookSignatureFormat } from "@/src/dict/bot-hook-dict";

type Params = {
    /**
     * The raw request body, exactly as received.
     */
    body: string;
    secret: string;
    /**
     * The signature header's value; missing fails.
     */
    signature?: string | null;
    format: BotHookSignatureFormat;
};

/**
 * Whether a hook call's HMAC-SHA256 signature of its raw body matches
 * the hook's secret, compared in constant time.
 */
export default function verifyHookSignature({ body, secret, signature, format }: Params): boolean {
    if (!signature || !secret) return false;

    const digest = createHmac("sha256", secret).update(body).digest();
    const given = signature.trim();

    const received = (() => {
        try {
            if (format == "base64") return Buffer.from(given, "base64");

            const hex = format == "sha256=hex" ? given.replace(/^sha256=/i, "") : given;

            if (!/^[0-9a-f]+$/i.test(hex) || hex.length % 2) return null;

            return Buffer.from(hex, "hex");
        } catch {
            return null;
        }
    })();

    if (!received || received.length != digest.length) return false;

    return timingSafeEqual(received, digest);
}
