/**
 * The harnesses: what a model is used for. Each harness has one model
 * setting (`harness_settings`). Text is the brain and can't be turned off;
 * the others are helpers it calls on. `automatic` ones pick a free model
 * themselves when none is picked; the rest (transcription, speech) are
 * not available until one is, since free picks there rarely work.
 */
export const Harnesses = [
    {
        title: "Text",
        value: "text",
        automatic: true,
        description: `Chats, plans and works on computers. Every bot thinks with it.`,
        required: true,
    },
    {
        title: "Media reading",
        value: "vision",
        automatic: true,
        description: `Reads images, scans and screenshots for the text model when it can't see them itself.`,
        required: false,
    },
    {
        title: "Transcription",
        value: "transcription",
        automatic: false,
        description: `Turns voice messages and recordings into text.`,
        required: false,
    },
    {
        title: "Speech",
        value: "speech",
        automatic: false,
        description: `Reads bot replies aloud.`,
        required: false,
    },
    {
        title: "Image generation",
        value: "image",
        automatic: true,
        description: `Makes images when a bot is asked for one.`,
        required: false,
    },
] as const;

export type HarnessKind = (typeof Harnesses)[number]["value"];

/**
 * Vendors preferred for automatic picks, best first. Free models from any
 * other vendor come after these, and only if they look competent.
 */
export const AutoModelVendorPreference = [
    "deepseek",
    "qwen",
    "nvidia",
    "liquid",
] as const;

/**
 * Routers that pick a model themselves (e.g. `openrouter/free`). Used as
 * the last automatic pick, after every named model.
 */
export const AutoModelRouterSlugs = ["openrouter/free"];

/**
 * Models with one narrow job (moderation, embeddings, ranking). Never
 * picked automatically.
 */
export const SpecialistModelPattern =
    /guard|safety|moderation|embed|rerank|classif/i;

/**
 * Names of small variants, ranked after their bigger siblings.
 */
export const SmallModelPattern =
    /(?:^|[-_.:/])(nano|mini|small|lite|lightning|tiny|micro|xs)(?=$|[-_.:])/i;
