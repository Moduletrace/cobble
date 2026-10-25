import type { BunextAPIRouteHandler, BunextServerRouteConfig } from "@moduletrace/bunext/types";
import { AppData } from "@/src/data/app-data";
import { BotHookIdempotencyHeaders, type BotHookSignatureFormat } from "@/src/dict/bot-hook-dict";
import findBotHookByToken from "@/src/functions/backend/db/bot-hooks/find-bot-hook-by-token";
import fireBotHook from "@/src/functions/backend/db/bot-hooks/fire-bot-hook";
import insertBotHookEvent from "@/src/functions/backend/db/bot-hooks/insert-bot-hook-event";
import { grabRequestIP } from "@/src/functions/backend/logger";
import { decrypt } from "@/src/utils/crypt";
import rateLimit from "@/src/utils/rate-limit";
import safeErrorMessage from "@/src/utils/safe-error-message";
import verifyHookSignature from "@/src/utils/verify-hook-signature";

/**
 * Bodies past this are refused (413) before the handler runs.
 */
export const config: BunextServerRouteConfig = {
    max_request_body_mb: AppData.BotHookMaxPayloadBytes / (1024 * 1024),
};

/**
 * The public end of a bot's hook: `POST /api/hooks/<token>` queues the
 * hook's brief, with the raw body as data, as a task for its bot
 * (`fireBotHook`). There's no session: the token is the key, checked
 * against its hash in constant time, and, when the hook has a signing
 * secret, the HMAC-SHA256 of the body too. Calls are rate limited per
 * address before any lookup and per hook after. Every unknown token gets
 * the same 404. Answers 202 once the run is queued (or the call joined one
 * still waiting), 200 for a delivery already taken or a notification the
 * hook's filter leaves out. Computers' notification watchers call it too.
 */
export const handler: BunextAPIRouteHandler = async ({ req, query }) => {
    try {
        if (req.method != "POST") {
            return reply({ status: 405, msg: `Use POST.` });
        }

        const ip = grabRequestIP(req) || "unknown";
        const minute = 60 * 1000;

        if (!rateLimit({ key: `bot-hook-ip:${ip}`, limit: AppData.BotHookIpRateLimit, window_ms: minute }).allowed) {
            return reply({ status: 429, msg: `Too many calls. Try again in a minute.` });
        }

        const token = String(query?.token || "");
        const hook = token ? await findBotHookByToken({ token }) : null;

        if (!hook?.id) {
            return reply({ status: 404, msg: `Not found.` });
        }

        if (!rateLimit({ key: `bot-hook:${hook.id}`, limit: AppData.BotHookRateLimit, window_ms: minute }).allowed) {
            return reply({ status: 429, msg: `Too many calls to this hook. Try again in a minute.` });
        }

        const payload = await req.text();
        const content_type = req.headers.get("content-type");

        if (hook.signing_secret) {
            const secret = await decrypt(hook.signing_secret).catch(() => "");
            const signed = verifyHookSignature({
                body: payload,
                secret,
                signature: hook.signature_header ? req.headers.get(hook.signature_header) : null,
                format: (hook.signature_format || "sha256=hex") as BotHookSignatureFormat,
            });

            if (!signed) {
                await insertBotHookEvent({
                    hook_id: hook.id,
                    payload: payload.slice(0, 2000),
                    content_type,
                    source_ip: ip,
                    status: "rejected",
                    error: `Bad or missing signature`,
                });

                return reply({ status: 401, msg: `Bad or missing signature.` });
            }
        }

        const idempotency_key =
            BotHookIdempotencyHeaders.map((name) => req.headers.get(name)).find(Boolean) || null;

        const result = await fireBotHook({ hook, payload, content_type, source_ip: ip, idempotency_key });

        if (result.status == "rejected") {
            return reply({ status: 409, msg: result.error || `This hook can't run now.` });
        }

        return reply({
            status: result.status == "duplicate" || result.status == "ignored" ? 200 : 202,
            ok: true,
            msg: result.status == "duplicate" ? `Already taken.` : result.status == "ignored" ? `Ignored.` : `Queued.`,
            event_id: result.event_id,
        });
    } catch (error: unknown) {
        return reply({ status: 500, msg: safeErrorMessage({ error }) });
    }
};

function reply({ status, ok = false, msg, event_id }: { status: number; ok?: boolean; msg: string; event_id?: number }) {
    return Response.json(
        { ok, msg, event_id },
        { status, headers: { "Cache-Control": "no-store", ...(status == 429 ? { "Retry-After": "60" } : {}) } },
    );
}
