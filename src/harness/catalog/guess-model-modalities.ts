import type { HarnessModelInfo } from "../types";

type Params = {
    slug: string;
};

type Guess = Pick<
    HarnessModelInfo,
    "input_modalities" | "output_modalities" | "supports_tools"
>;

const Transcription = /whisper|transcri|(?:^|[-_/])(stt|asr)(?=$|[-_:.])|scribe/i;
const Speech = /(?:^|[-_/])tts(?=$|[-_:.])|speech|voice/i;
const ImageOut = /dall-e|gpt-image|imagen|flux|stable-diffusion|sdxl|image-gen/i;
const Embedding = /embed/i;
/**
 * Chat families that read images.
 */
const ImageIn =
    /vision|(?:^|[-_/])vl(?=$|[-_:.])|gpt-4o|gpt-4\.1|gpt-[5-9]|claude|gemini|llava|pixtral|gemma-?[34]|grok-[2-9]|llama-?4|mistral-(small|medium)/i;

/**
 * What a model takes and makes, guessed from its id, for providers whose
 * model list only has ids. Anything that isn't plainly a speech, image or
 * embedding model is taken for a chat model that can call tools.
 */
export default function guessModelModalities({ slug }: Params): Guess {
    if (Transcription.test(slug)) {
        return {
            input_modalities: ["audio"],
            output_modalities: ["transcription"],
            supports_tools: false,
        };
    }

    if (Speech.test(slug)) {
        return {
            input_modalities: ["text"],
            output_modalities: ["speech"],
            supports_tools: false,
        };
    }

    if (ImageOut.test(slug)) {
        return {
            input_modalities: ["text", "image"],
            output_modalities: ["image"],
            supports_tools: false,
        };
    }

    if (Embedding.test(slug)) {
        return {
            input_modalities: ["text"],
            output_modalities: ["embeddings"],
            supports_tools: false,
        };
    }

    return {
        input_modalities: ImageIn.test(slug) ? ["text", "image"] : ["text"],
        output_modalities: ["text"],
        supports_tools: true,
    };
}
