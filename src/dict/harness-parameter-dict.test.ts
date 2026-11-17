import { describe, expect, test } from "bun:test";
import {
    harnessParameterDefault,
    HarnessParameters,
    harnessParametersFromOptions,
    harnessParameterValue,
    modelAdvertisesParameter,
    withHarnessParameters,
} from "./harness-parameter-dict";

const temperature = HarnessParameters.find((p) => p.key == "temperature")!;
const reasoning = HarnessParameters.find((p) => p.key == "reasoning_effort")!;

describe("harness parameters", () => {
    test("reads only the known settings out of options", () => {
        expect(
            harnessParametersFromOptions({
                options: { voice: "alloy", temperature: 0.2, seed: 0, junk: "x" },
            }),
        ).toEqual({ temperature: 0.2, seed: 0 });
    });

    test("replaces the settings and keeps voice", () => {
        expect(
            withHarnessParameters({
                options: { voice: "alloy", temperature: 1, top_p: 0.5 },
                params: { temperature: 0.2 },
            }),
        ).toEqual({ voice: "alloy", temperature: 0.2 });
    });

    test("only offers what the model advertises", () => {
        const supported = ["tools", "temperature", "reasoning"];

        expect(modelAdvertisesParameter({ parameter: temperature, supported })).toBe(true);
        expect(modelAdvertisesParameter({ parameter: reasoning, supported })).toBe(true);
        expect(
            modelAdvertisesParameter({
                parameter: temperature,
                supported: ["tools", "top_p"],
            }),
        ).toBe(false);
    });

    test("ships a literal text default and a lookup vision default", () => {
        expect(harnessParameterDefault({ harness: "text", key: "temperature" })).toBe(0.3);
        expect(harnessParameterDefault({ harness: "vision", key: "temperature" })).toBe(0);
        expect(harnessParameterDefault({ harness: "text", key: "seed" })).toBeUndefined();
    });

    test("a model that lists no parameters takes none", () => {
        expect(
            modelAdvertisesParameter({ parameter: temperature, supported: [] }),
        ).toBe(false);
        expect(
            modelAdvertisesParameter({ parameter: temperature, supported: undefined }),
        ).toBe(false);
    });

    test("a saved value beats the default, and the default fills an empty one", () => {
        expect(
            harnessParameterValue({ harness: "text", params: { temperature: 0.7 }, key: "temperature" }),
        ).toEqual({ value: 0.7, saved: true });
        expect(
            harnessParameterValue({ harness: "text", params: {}, key: "temperature" }),
        ).toEqual({ value: 0.3, saved: false });
        expect(
            harnessParameterValue({ harness: "text", params: { temperature: 0 }, key: "temperature" }),
        ).toEqual({ value: 0, saved: true });
    });
});
