import { afterAll, afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import HarnessError from "../../harness-error";
import type { HarnessCandidate } from "../../types";

let payload: unknown = { text: "hello world" };
let request: any = null;

mock.module("./provider-request", () => ({
    default: async (args: any) => {
        request = args;

        return { json: async () => payload };
    },
}));

const { default: transcribe } = await import("./transcribe");

const candidate = {
    key: "text:whisper",
    provider: { kind: "custom", base_url: "https://api.example.com", name: "Example" },
    model: { slug: "whisper-1" },
    source: "pinned",
} as unknown as HarnessCandidate;

const audio = { data: new Uint8Array([1, 2, 3]), format: "wav" };
const signal = new AbortController().signal;

afterAll(() => mock.restore());
beforeEach(() => {
    payload = { text: "hello world" };
    request = null;
});

describe("transcribe", () => {
    test("returns the trimmed transcript", async () => {
        payload = { text: "  hello world  " };

        const result = await transcribe({ candidate, audio, signal });

        expect(result.text).toBe("hello world");
    });

    test("an empty transcript is a retryable failure, not a silent reading (L8)", async () => {
        payload = { text: "" };

        await expect(transcribe({ candidate, audio, signal })).rejects.toBeInstanceOf(HarnessError);
        await expect(transcribe({ candidate, audio, signal })).rejects.toMatchObject({
            retryable: true,
        });
    });

    test("a whitespace-only transcript is a retryable failure too (L8)", async () => {
        payload = { text: "   \n " };

        await expect(transcribe({ candidate, audio, signal })).rejects.toMatchObject({
            retryable: true,
        });
    });

    test("an unreadable answer is a retryable failure", async () => {
        payload = null;

        await expect(transcribe({ candidate, audio, signal })).rejects.toBeInstanceOf(HarnessError);
    });

    test("carries the provider's usage when it reports one", async () => {
        payload = { text: "hi", usage: { prompt_tokens: 10, completion_tokens: 2 } };

        const result = await transcribe({ candidate, audio, signal });

        expect(result.usage).toEqual({ prompt_tokens: 10, completion_tokens: 2 });
    });

    test("Alibaba's hosts are asked on the native route, not /audio/transcriptions", async () => {
        payload = { output: { text: " 你好 " } };

        const result = await transcribe({
            candidate: tokenPlanCandidate({ slug: "qwen-audio-3.0-asr-flash" }),
            audio,
            signal,
        });

        expect(result.text).toBe("你好");
        expect(request.path).toBe("/api/v1/services/aigc/multimodal-generation/generation");
        expect(request.base_url).toBe("https://token-plan.ap-southeast-1.maas.aliyuncs.com");
        expect(request.form).toBeUndefined();
        expect(request.json.model).toBe("qwen-audio-3.0-asr-flash");
        expect(request.json.input.messages[0].content[0]).toEqual({
            type: "input_audio",
            input_audio: { data: "data:audio/wav;base64,AQID" },
        });
        expect(request.json.parameters).toEqual({ format: "wav" });
    });

    test("the native call labels the recording's format and cuts the language to its primary subtag", async () => {
        payload = { output: { text: "hello" } };

        await transcribe({
            candidate: tokenPlanCandidate({ slug: "qwen-audio-3.0-asr-flash" }),
            audio: { data: new Uint8Array([1, 2, 3]), format: "webm" },
            language: "en-US",
            signal,
        });

        expect(request.json.input.messages[0].content[0].input_audio.data).toStartWith(
            "data:audio/webm;base64,",
        );
        expect(request.json.parameters).toEqual({ format: "webm", language_hints: ["en"] });
    });

    test("a model that only transcribes as a job is refused without a call", async () => {
        const error = await transcribe({
            candidate: tokenPlanCandidate({ slug: "qwen3-asr-flash-filetrans" }),
            audio,
            signal,
        }).catch((thrown: unknown) => thrown);

        expect(error).toBeInstanceOf(HarnessError);
        expect(error).toMatchObject({ retryable: false });
        expect(request).toBeNull();
    });

    test("an ASR model on another provider keeps the OpenAI-style upload", async () => {
        payload = { text: "hello" };

        await transcribe({
            candidate: {
                ...candidate,
                model: { slug: "qwen3-asr-flash" },
            } as unknown as HarnessCandidate,
            audio,
            signal,
        });

        expect(request.path).toBe("/audio/transcriptions");
        expect(request.form).toBeInstanceOf(FormData);
    });
});

function tokenPlanCandidate({ slug }: { slug: string }) {
    return {
        key: `transcription:${slug}`,
        provider: {
            kind: "custom",
            base_url: "https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1",
            name: "Alibaba Cloud Token Plan",
        },
        model: { slug },
        source: "pinned",
    } as unknown as HarnessCandidate;
}