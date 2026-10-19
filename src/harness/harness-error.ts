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
    provider_wide?: boolean;
    candidate_key?: string;
    resting?: boolean;
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

    constructor({
        message,
        code = "provider",
        status,
        retryable = false,
        retry_at,
        provider_wide = false,
        candidate_key,
        resting = false,
    }: Params) {
        super(message);
        this.name = "HarnessError";
        this.code = code;
        this.status = status;
        this.retryable = retryable;
        this.retry_at = retry_at;
        this.provider_wide = provider_wide;
        this.candidate_key = candidate_key;
        this.resting = resting;
    }
}
