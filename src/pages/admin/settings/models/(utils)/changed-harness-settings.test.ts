import { describe, expect, test } from "bun:test";
import changedHarnessSettings from "./changed-harness-settings";

const saved = {
    text: { model_id: null, provider_id: null, fallback: true, enabled: true },
    speech: { model_id: 4, provider_id: null, fallback: true, enabled: true, voice: "george" },
};

describe("changedHarnessSettings", () => {
    test("is empty when nothing changed", () => {
        expect(
            changedHarnessSettings({ form: structuredClone(saved), saved }),
        ).toEqual([]);
    });

    test("lists only the harnesses that changed", () => {
        expect(
            changedHarnessSettings({
                form: {
                    ...saved,
                    speech: { ...saved.speech, voice: "sarah" },
                },
                saved,
            }),
        ).toEqual([
            {
                harness: "speech",
                model_id: 4,
                provider_id: null,
                fallback: true,
                enabled: true,
                voice: "sarah",
            },
        ]);
    });

    test("lists a provider change", () => {
        expect(
            changedHarnessSettings({
                form: { ...saved, text: { ...saved.text, provider_id: 2 } },
                saved,
            }),
        ).toEqual([{ harness: "text", model_id: null, provider_id: 2, fallback: true, enabled: true }]);
    });

    test("lists the text model's own media reading turned on", () => {
        expect(
            changedHarnessSettings({
                form: { ...saved, text: { ...saved.text, sees_images: true } },
                saved,
            }),
        ).toEqual([
            { harness: "text", model_id: null, provider_id: null, fallback: true, enabled: true, sees_images: true },
        ]);
    });

    test("treats an empty voice as no voice", () => {
        expect(
            changedHarnessSettings({
                form: { text: { ...saved.text, voice: "" } },
                saved,
            }),
        ).toEqual([]);
    });
    test("lists a change to the fallback models, in order", () => {
        const with_fallbacks = { ...saved, text: { ...saved.text, model_id: 9, fallback_model_ids: [3, 5] } };

        expect(changedHarnessSettings({ form: structuredClone(with_fallbacks), saved: with_fallbacks })).toEqual([]);
        expect(
            changedHarnessSettings({
                form: { ...with_fallbacks, text: { ...with_fallbacks.text, fallback_model_ids: [5, 3] } },
                saved: with_fallbacks,
            }).map((setting) => setting.harness),
        ).toEqual(["text"]);
    });
});
