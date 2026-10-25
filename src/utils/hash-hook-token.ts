import { createHash } from "node:crypto";
import { BotHookTokenPrefix } from "@/src/dict/bot-hook-dict";

type Params = {
    token: string;
};

/**
 * What a hook keeps of its token: the first characters, to find the hook
 * a call names, and the SHA-256 (hex) of the whole token, to check it.
 * The token itself is never stored.
 */
export default function hashHookToken({ token }: Params) {
    return {
        prefix: token.slice(0, BotHookTokenPrefix.length + 8),
        hash: createHash("sha256").update(token).digest("hex"),
    };
}
