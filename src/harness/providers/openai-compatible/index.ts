import type { HarnessAdapter } from "../../types";
import chat from "./chat";
import embed from "./embed";
import generateImage from "./generate-image";
import listModels from "./list-models";
import speak from "./speak";
import transcribe from "./transcribe";

/**
 * The OpenAI-compatible API: OpenRouter, OpenAI, Groq, Mistral, xAI,
 * DeepSeek, Gemini and Anthropic (through their compatibility layers),
 * Ollama, vLLM, LM Studio and llama.cpp.
 */
const OpenAICompatibleAdapter: HarnessAdapter = {
    chat,
    transcribe,
    speak,
    generateImage,
    embed,
    listModels,
};

export default OpenAICompatibleAdapter;
