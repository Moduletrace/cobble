/**
 * Model providers a super admin can plug in. Every one is called through
 * its OpenAI-compatible API for now (`src/harness/providers/`); a provider
 * that needs its own API gets its own adapter there.
 *
 * - `key_env`: environment variable used when no key is saved
 * - `catalog`: how its models are listed. `openrouter` gives modalities,
 *   tools support and prices; `openai-compatible` gives only ids, so
 *   capabilities are guessed from the names
 * - `local`: runs on the user's own hardware, so its models count as free
 * - `parameters`: the generation settings its models get when its own model
 *   list carries none (`HarnessParameters` keys). Empty for a provider whose
 *   catalog decides (OpenRouter) or whose host is checked instead (custom)
 * - `image_path`: image generation endpoint
 * - `image_edit_path`: where images made from reference images go. OpenRouter
 *   takes them on `image_path` (`input_references`); the others take a
 *   multipart upload at `/images/edits`
 * - `video_path`: where video jobs are asked for and checked on
 *   (`<video_path>/<id>`, its bytes at `<video_path>/<id>/content`).
 *   OpenRouter's takes JSON with images and videos to work from; the
 *   others are called the way OpenAI's (Sora) is: a multipart form with at
 *   most one image to start from and no videos
 */
export const HarnessProviderKinds = [
    {
        title: "OpenRouter",
        value: "openrouter",
        parameters: [],
        base_url: "https://openrouter.ai/api/v1",
        needs_key: true,
        key_env: "OPENROUTER_API_KEY",
        catalog: "openrouter",
        local: false,
        image_path: "/images",
        image_edit_path: "/images",
        video_path: "/videos",
    },
    {
        title: "OpenAI",
        value: "openai",
        parameters: ["temperature", "top_p", "frequency_penalty", "presence_penalty", "seed", "reasoning_effort"],
        base_url: "https://api.openai.com/v1",
        needs_key: true,
        key_env: "OPENAI_API_KEY",
        catalog: "openai-compatible",
        local: false,
        image_path: "/images/generations",
        image_edit_path: "/images/edits",
        video_path: "/videos",
    },
    {
        title: "Anthropic",
        value: "anthropic",
        parameters: ["temperature", "top_p", "top_k"],
        base_url: "https://api.anthropic.com/v1",
        needs_key: true,
        key_env: "ANTHROPIC_API_KEY",
        catalog: "openai-compatible",
        local: false,
        image_path: "/images/generations",
        image_edit_path: "/images/edits",
        video_path: "/videos",
    },
    {
        title: "Google Gemini",
        value: "google",
        parameters: ["temperature", "top_p", "top_k", "seed", "frequency_penalty", "presence_penalty"],
        base_url: "https://generativelanguage.googleapis.com/v1beta/openai",
        needs_key: true,
        key_env: "GEMINI_API_KEY",
        catalog: "openai-compatible",
        local: false,
        image_path: "/images/generations",
        image_edit_path: "/images/edits",
        video_path: "/videos",
    },
    {
        title: "DeepSeek",
        value: "deepseek",
        parameters: ["temperature", "top_p", "frequency_penalty", "presence_penalty"],
        base_url: "https://api.deepseek.com",
        needs_key: true,
        key_env: "DEEPSEEK_API_KEY",
        catalog: "openai-compatible",
        local: false,
        image_path: "/images/generations",
        image_edit_path: "/images/edits",
        video_path: "/videos",
    },
    {
        title: "Groq",
        value: "groq",
        parameters: ["temperature", "top_p", "top_k", "seed", "frequency_penalty", "presence_penalty", "reasoning_effort"],
        base_url: "https://api.groq.com/openai/v1",
        needs_key: true,
        key_env: "GROQ_API_KEY",
        catalog: "openai-compatible",
        local: false,
        image_path: "/images/generations",
        image_edit_path: "/images/edits",
        video_path: "/videos",
    },
    {
        title: "Mistral",
        value: "mistral",
        parameters: ["temperature", "top_p", "top_k", "seed", "frequency_penalty", "presence_penalty"],
        base_url: "https://api.mistral.ai/v1",
        needs_key: true,
        key_env: "MISTRAL_API_KEY",
        catalog: "openai-compatible",
        local: false,
        image_path: "/images/generations",
        image_edit_path: "/images/edits",
        video_path: "/videos",
    },
    {
        title: "xAI",
        value: "xai",
        parameters: ["temperature", "top_p", "presence_penalty", "frequency_penalty", "seed", "reasoning_effort"],
        base_url: "https://api.x.ai/v1",
        needs_key: true,
        key_env: "XAI_API_KEY",
        catalog: "openai-compatible",
        local: false,
        image_path: "/images/generations",
        image_edit_path: "/images/edits",
        video_path: "/videos",
    },
    {
        title: "Ollama",
        value: "ollama",
        parameters: ["temperature", "top_p", "top_k", "min_p", "repetition_penalty", "seed"],
        base_url: "http://localhost:11434/v1",
        needs_key: false,
        key_env: "",
        catalog: "openai-compatible",
        local: true,
        image_path: "/images/generations",
        image_edit_path: "/images/edits",
        video_path: "/videos",
    },
    {
        title: "Other (OpenAI-compatible)",
        value: "custom",
        parameters: [],
        base_url: "",
        needs_key: false,
        key_env: "",
        catalog: "openai-compatible",
        local: false,
        image_path: "/images/generations",
        image_edit_path: "/images/edits",
        video_path: "/videos",
    },
] as const;

export type HarnessProviderKind = (typeof HarnessProviderKinds)[number]["value"];

export type HarnessProviderPreset = (typeof HarnessProviderKinds)[number];

/**
 * Created on first run so the automatic free picks work out of the box.
 */
export const DefaultHarnessProviderKind: HarnessProviderKind = "openrouter";
