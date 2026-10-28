import { z } from "zod";
import { AppData } from "@/src/data/app-data";
import { BotQuestionKinds } from "@/src/dict/bot-question-dict";

/**
 * One question as a bot writes it (`ask_user`) and as it's stored.
 */
export const BotQuestionItemSchema = z.object({
    question: z.string().trim().min(3, "Write the question").max(300).describe("The question, e.g. \"Which environment should I deploy to?\""),
    kind: z
        .enum(BotQuestionKinds)
        .describe("single: the user picks exactly one option (radios). multiple: any number, at least one (checkboxes)."),
    options: z
        .array(z.string().trim().min(1).max(200))
        .min(2, "Give at least two options")
        .max(AppData.BotQuestionMaxOptions, `Give at most ${AppData.BotQuestionMaxOptions} options`)
        .refine((options) => new Set(options.map((option) => option.toLowerCase())).size == options.length, "Options must differ")
        .describe("The answers to choose from, each short and distinct"),
    allow_other: z
        .boolean()
        .optional()
        .describe("Let the user type an answer of their own besides the options. Set it unless the options cover every case."),
});

export const BotQuestionItemsSchema = z
    .array(BotQuestionItemSchema)
    .min(1, "Ask at least one question")
    .max(AppData.BotQuestionMaxQuestions, `Ask at most ${AppData.BotQuestionMaxQuestions} questions at once`);

export const BotQuestionIdSchema = z.object({
    question_id: z.coerce.number().int().positive("Pick the questions"),
});

export const AnswerBotQuestionSchema = z.object({
    question_id: z.coerce.number().int().positive("Pick the questions"),
    answers: z
        .array(
            z.object({
                choices: z.array(z.number().int().min(0)).max(AppData.BotQuestionMaxOptions),
                other: z.string().max(AppData.BotQuestionOtherMaxChars, `Keep answers under ${AppData.BotQuestionOtherMaxChars} characters`).optional(),
            }),
        )
        .max(AppData.BotQuestionMaxQuestions),
});

export type BotQuestionIdRequest = z.infer<typeof BotQuestionIdSchema>;
export type AnswerBotQuestionRequest = z.infer<typeof AnswerBotQuestionSchema>;
