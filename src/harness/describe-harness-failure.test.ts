import { describe, expect, test } from "bun:test";
import HarnessError from "./harness-error";
import describeHarnessFailure from "./describe-harness-failure";

describe("describeHarnessFailure", () => {
    test("names the model the candidate ran on, then the error", () => {
        const error = new HarnessError({
            message: "Alibaba Cloud Token Plan: HTTP 404 at POST https://token-plan.example/images/generations",
            status: 404,
            model_name: "qwen-image-3.0-pro",
        });

        expect(describeHarnessFailure({ error })).toBe(
            "qwen-image-3.0-pro: Alibaba Cloud Token Plan: HTTP 404 at POST https://token-plan.example/images/generations",
        );
    });

    test("a failure that already names the model is not repeated", () => {
        const error = new HarnessError({
            message: "qwen-image-3.0-pro: HTTP 404",
            status: 404,
            model_name: "qwen-image-3.0-pro",
        });

        expect(describeHarnessFailure({ error })).toBe("qwen-image-3.0-pro: HTTP 404");
    });

    test("anything else keeps its message", () => {
        expect(describeHarnessFailure({ error: new Error("boom") })).toBe("boom");
        expect(
            describeHarnessFailure({ error: new HarnessError({ message: "No image model is set up." }) }),
        ).toBe("No image model is set up.");
    });
});