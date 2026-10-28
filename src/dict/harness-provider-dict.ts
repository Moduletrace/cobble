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
 * - `image_path`: image generation endpoint
 * - `image_edit_path`: where images made from reference images go. OpenRouter
 *   takes them on `image_path` (`input_references`); the others take a
 *   multipart upload at `/images/edits`
 */
export const HarnessProviderKinds = [
    {
        title: "OpenRouter",
        value: "openrouter",
        base_url: "https://openrouter.ai/api/v1",
        needs_key: true,
        key_env: "OPENROUTER_API_KEY",
        catalog: "openrouter",
        local: false,
        image_path: "/images",
        image_edit_path: "/images",
    },
    {
        title: "OpenAI",
        value: "openai",
        base_url: "https://api.openai.com/v1",
        needs_key: true,
        key_env: "OPENAI_API_KEY",
        catalog: "openai-compatible",
        local: false,
        image_path: "/images/generations",
        image_edit_path: "/images/edits",
    },
    {
        title: "Anthropic",
        value: "anthropic",
        base_url: "https://api.anthropic.com/v1",
        needs_key: true,
        key_env: "ANTHROPIC_API_KEY",
        catalog: "openai-compatible",
        local: false,
        image_path: "/images/generations",
        image_edit_path: "/images/edits",
    },
    {
        title: "Google Gemini",
        value: "google",
        base_url: "https://generativelanguage.googleapis.com/v1beta/openai",
        needs_key: true,
        key_env: "GEMINI_API_KEY",
        catalog: "openai-compatible",
        local: false,
        image_path: "/images/generations",
        image_edit_path: "/images/edits",
    },
    {
        title: "DeepSeek",
        value: "deepseek",
        base_url: "https://api.deepseek.com",
        needs_key: true,
        key_env: "DEEPSEEK_API_KEY",
        catalog: "openai-compatible",
        local: false,
        image_path: "/images/generations",
        image_edit_path: "/images/edits",
    },
    {
        title: "Groq",
        value: "groq",
        base_url: "https://api.groq.com/openai/v1",
        needs_key: true,
        key_env: "GROQ_API_KEY",
        catalog: "openai-compatible",
        local: false,
        image_path: "/images/generations",
        image_edit_path: "/images/edits",
    },
    {
        title: "Mistral",
        value: "mistral",
        base_url: "https://api.mistral.ai/v1",
        needs_key: true,
        key_env: "MISTRAL_API_KEY",
        catalog: "openai-compatible",
        local: false,
        image_path: "/images/generations",
        image_edit_path: "/images/edits",
    },
    {
        title: "xAI",
        value: "xai",
        base_url: "https://api.x.ai/v1",
        needs_key: true,
        key_env: "XAI_API_KEY",
        catalog: "openai-compatible",
        local: false,
        image_path: "/images/generations",
        image_edit_path: "/images/edits",
    },
    {
        title: "Ollama",
        value: "ollama",
        base_url: "http://localhost:11434/v1",
        needs_key: false,
        key_env: "",
        catalog: "openai-compatible",
        local: true,
        image_path: "/images/generations",
        image_edit_path: "/images/edits",
    },
    {
        title: "Other (OpenAI-compatible)",
        value: "custom",
        base_url: "",
        needs_key: false,
        key_env: "",
        catalog: "openai-compatible",
        local: false,
        image_path: "/images/generations",
        image_edit_path: "/images/edits",
    },
] as const;

export type HarnessProviderKind = (typeof HarnessProviderKinds)[number]["value"];

export type HarnessProviderPreset = (typeof HarnessProviderKinds)[number];

/**
 * Created on first run so the automatic free picks work out of the box.
 */
export const DefaultHarnessProviderKind: HarnessProviderKind = "openrouter";
