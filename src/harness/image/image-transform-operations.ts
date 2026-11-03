import { z } from "zod";
import { AppData } from "@/src/data/app-data";

const Side = z.number().int().positive().max(AppData.ImageTransformMaxDimension);

/**
 * One step of an `transform_image` call. Strict, so a misnamed field is refused
 * instead of silently dropped (a crop with `w` for `width` would otherwise
 * fail as "no width").
 */
export const ImageTransformOperationSchema = z.discriminatedUnion("op", [
    z
        .object({
            op: z.literal("crop"),
            x: z.number().min(0).describe(`Left edge of the box`),
            y: z.number().min(0).describe(`Top edge of the box`),
            width: z.number().positive(),
            height: z.number().positive(),
            unit: z
                .enum(["px", "percent"])
                .optional()
                .describe(`"px" (default) or "percent" of the image's width and height`),
        })
        .strict(),
    z
        .object({
            op: z.literal("resize"),
            width: Side.optional(),
            height: Side.optional(),
            fit: z
                .enum(["inside", "cover", "contain", "fill"])
                .optional()
                .describe(
                    `With both sides: "inside" (default) keeps the aspect ratio within the box, "cover" fills it and crops the overflow, "contain" fits it and pads with transparency, "fill" stretches`,
                ),
        })
        .strict(),
    z
        .object({
            op: z.literal("rotate"),
            degrees: z.number().min(-360).max(360).describe(`Clockwise; other than 90s leave transparent corners`),
        })
        .strict(),
    z.object({ op: z.literal("flip"), direction: z.enum(["horizontal", "vertical"]) }).strict(),
    z.object({ op: z.literal("grayscale") }).strict(),
    z.object({ op: z.literal("blur"), sigma: z.number().min(0.3).max(100).optional() }).strict(),
    z.object({ op: z.literal("sharpen"), sigma: z.number().min(0.01).max(10).optional() }).strict(),
    z
        .object({
            op: z.literal("adjust"),
            brightness: z.number().min(0).max(10).optional().describe(`1 is unchanged`),
            saturation: z.number().min(0).max(10).optional().describe(`1 is unchanged, 0 grey`),
            hue: z.number().min(-360).max(360).optional().describe(`Degrees to turn the hues`),
        })
        .strict(),
    z
        .object({
            op: z.literal("trim"),
            threshold: z
                .number()
                .min(0)
                .max(255)
                .optional()
                .describe(`How different from the corner colour a pixel must be to stay (default 10)`),
        })
        .strict(),
]);

export type ImageTransformOperation = z.infer<typeof ImageTransformOperationSchema>;
