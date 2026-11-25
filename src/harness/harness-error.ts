/**
 * - `provider`: the provider refused or failed the call
 * - `unavailable`: no model is set up (or left) for the harness
 * - `aborted`: the caller cancelled
 */
export type HarnessErrorCode = "provider" | "unavailable" | "aborted";

type Params = {
    message: string;
    code?: HarnessErrorCode;
    status?: number;
    retryable?: boolean;
    retry_at?: number;
    /**
     * The provider never answered within `AppData.HarnessRequestTimeoutMs`.
     * A tool whose retry only waits the same span again (`generate_image`)
     * reads it to stop instead of spending another three minutes.
     */
    timed_out?: boolean;
    provider_wide?: boolean;
    candidate_key?: string;
    resting?: boolean;
    /**
     * The request that failed: a 404 on a provider that has no endpoint at
     * that address is only diagnosable with both in the message.
     */
    method?: string;
    url?: string;
    /**
     * The model the provider knew the call by. The caller that ran the
     * candidate stamps it, so a tool can name the model the setting picked
     * instead of leaving the bot to guess one.
     */
    model_name?: string;
    /**
     * No fallback and no retry can help: another model fails the same way
     * (or the caller's own prompt is the problem), so the run stops with
     * this message rather than spending the next candidate on it.
     */
    fatal?: boolean;
};

/**
 * A failed harness call. Its message is safe to show the user.
 */
export default class HarnessError extends Error {
    code: HarnessErrorCode;
    status?: number;
    /**
     * Worth trying again later (rate limit, outage, timeout). False when
     * only a different model or setting can help.
     */
    retryable: boolean;
    /**
     * Unix ms before which the failed candidate shouldn't be tried again.
     */
    retry_at?: number;
    timed_out: boolean;
    /**
     * The provider's key or account is the problem, so every model on it
     * fails the same way.
     */
    provider_wide: boolean;
    candidate_key?: string;
    /**
     * No model was tried: every one is cooling down until `retry_at`. A
     * queued job waits instead of using up an attempt.
     */
    resting: boolean;
    method?: string;
    url?: string;
    model_name?: string;
    /**
     * Nothing else can be tried: `withCandidates` rethrows it at once,
     * without resting the candidate or falling back to another model.
     */
    fatal: boolean;

    constructor({
        message,
        code = "provider",
        status,
        retryable = false,
        retry_at,
        timed_out = false,
        provider_wide = false,
        candidate_key,
        resting = false,
        method,
        url,
        model_name,
        fatal = false,
    }: Params) {
        super(message);
        this.name = "HarnessError";
        this.code = code;
        this.status = status;
        this.retryable = retryable;
        this.retry_at = retry_at;
        this.timed_out = timed_out;
        this.provider_wide = provider_wide;
        this.candidate_key = candidate_key;
        this.resting = resting;
        this.method = method;
        this.url = url;
        this.model_name = model_name;
        this.fatal = fatal;
    }
}
