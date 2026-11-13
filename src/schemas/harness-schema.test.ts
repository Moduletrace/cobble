import { describe, expect, test } from "bun:test";
import { AppData } from "@/src/data/app-data";
import { SaveRunLimitsRequestSchema } from "./harness-schema";

const full = {
    task_steps: 0,
    reply_steps: 0,
    unattended_steps: 0,
    run_tokens: 0,
    context_tokens: 0,
    model_rest_seconds: 0,
};

describe("SaveRunLimitsRequestSchema", () => {
    test("takes -1 as no limit, on every limit", () => {
        const parsed = SaveRunLimitsRequestSchema.parse({
            task_steps: -1,
            reply_steps: -1,
            unattended_steps: -1,
            run_tokens: -1,
            context_tokens: -1,
            model_rest_seconds: -1,
        });

        expect(parsed).toEqual({
            task_steps: -1,
            reply_steps: -1,
            unattended_steps: -1,
            run_tokens: -1,
            context_tokens: -1,
            model_rest_seconds: -1,
        });
    });

    test("still takes 0 as the default, and a number inside its range", () => {
        expect(SaveRunLimitsRequestSchema.parse(full).task_steps).toBe(0);
        expect(
            SaveRunLimitsRequestSchema.parse({
                ...full,
                task_steps: 60,
                run_tokens: AppData.RunMaxPromptTokensMin,
                model_rest_seconds: AppData.HarnessModelRestMinSeconds,
            }).run_tokens,
        ).toBe(AppData.RunMaxPromptTokensMin);
    });

    test("refuses a limit below no limit, or past its ceiling", () => {
        expect(SaveRunLimitsRequestSchema.safeParse({ ...full, task_steps: -2 }).success).toBe(false);
        expect(SaveRunLimitsRequestSchema.safeParse({ ...full, run_tokens: -2 }).success).toBe(false);
        expect(SaveRunLimitsRequestSchema.safeParse({ ...full, task_steps: AppData.BotStepLimitMax + 1 }).success).toBe(
            false,
        );
        expect(SaveRunLimitsRequestSchema.safeParse({ ...full, run_tokens: AppData.RunMaxPromptTokensMax + 1 }).success).toBe(
            false,
        );
    });
});