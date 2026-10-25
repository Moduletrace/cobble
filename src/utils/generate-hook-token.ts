import { BotHookTokenPrefix } from "@/src/dict/bot-hook-dict";
import hashHookToken from "./hash-hook-token";

/**
 * A new hook token (32 random bytes, base64url, after `BotHookTokenPrefix`)
 * with what is stored of it. The token is shown to the user once.
 */
export default function generateHookToken() {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    const token = `${BotHookTokenPrefix}${Buffer.from(bytes).toString("base64url")}`;

    return { token, ...hashHookToken({ token }) };
}
