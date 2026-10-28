/**
 * Who and what a model call was for. Every harness call that reports its
 * usage is written down with this (`/api/auth/crud` no: `token_usages`),
 * so a message, a session, a bot or a provider can be totaled later.
 *
 * It is deliberately shaped slightly differently from the table's
 * columns: `user_id` is required here (a row without an owner can't be
 * shown or totaled for anyone), the rest are optional.
 */
export type HarnessUsageScope = {
    /**
     * Whose work it was: the user whose conversation the call ran for.
     */
    user_id?: number | string;
    bot_id?: number | string | null;
    workspace_id?: number | string | null;
    session_id?: number | string | null;
    /**
     * The queued job it ran for, when it ran for one.
     */
    job_id?: number | string | null;
    /**
     * The message it produced, for the ones that produce one.
     */
    message_id?: number | string | null;
};

/**
 * What the caller knows about the call beyond its scope: which harness
 * asked, and which candidate answered. Both are filled in by the call's
 * own entry point, never by the code that runs it.
 */
export type HarnessCallSettings = {
    /**
     * `pinned`: the model picked in the setting. `auto`: an automatic pick.
     */
    model_source: "pinned" | "auto";
    /**
     * Whose setting the call used: the workspace's, the bot's own or the
     * install's default. Left out when the call overrode it.
     */
    settings_source?: "default" | "bot" | "workspace";
    /**
     * The generation settings sent, by their setting key
     * (`HarnessParameters`: `temperature`, `reasoning_effort`, ...).
     */
    params?: Record<string, number | string>;
    max_tokens?: number;
    /**
     * The voice asked for (speech).
     */
    voice?: string;
    /**
     * The candidates (`<provider id>:<slug>`) that failed before this one
     * answered, in the order they were tried.
     */
    fell_back_from?: string[];
};

export type HarnessUsageCall = {
    harness: "text" | "vision" | "transcription" | "speech" | "image" | "image_edit" | "embedding";
    provider_id?: number;
    provider_name?: string;
    model_id?: number;
    model_slug?: string;
    prompt_tokens: number;
    completion_tokens: number;
    cost?: number;
    settings?: HarnessCallSettings;
};

/**
 * A message's usage, as its thread shows it and as `token_usages` stores
 * it: what one answer cost, summed over its model calls.
 */
export type TokenUsageSummary = {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    /**
     * In USD, when the provider reported it.
     */
    cost?: number;
    /**
     * How many model calls it took.
     */
    calls: number;
};
