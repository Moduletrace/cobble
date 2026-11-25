import { describe, expect, test } from "bun:test";
import modelSupportedParameters from "./model-supported-parameters";

describe("model supported parameters", () => {
    test("the provider's own list wins", () => {
        expect(
            modelSupportedParameters({
                model: { supported_parameters: ["temperature"] },
                provider_parameters: ["temperature", "seed"],
            }),
        ).toEqual(["temperature"]);
    });

    test("a model that lists none gets the provider's", () => {
        expect(
            modelSupportedParameters({
                model: {},
                provider_parameters: ["temperature", "seed"],
            }),
        ).toEqual(["temperature", "seed"]);
    });

    test("nothing declared stays nothing", () => {
        expect(modelSupportedParameters({ model: {} })).toBeNull();
    });
});