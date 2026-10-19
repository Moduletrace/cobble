import { z } from "zod";

const PushEndpointField = z
    .string()
    .trim()
    .min(1, "Missing the device's push endpoint")
    .max(2048, "That push endpoint is too long")
    .refine(
        (value) => value.startsWith("https://"),
        "A push endpoint must use https",
    );

export const SavePushSubscriptionSchema = z.object({
    endpoint: PushEndpointField,
    keys: z.object({
        p256dh: z.string().trim().min(1).max(200),
        auth: z.string().trim().min(1).max(100),
    }),
    /**
     * Sent by the browser, only to label the device in Settings.
     */
    user_agent: z.string().max(400).optional(),
    platform: z.string().max(100).optional(),
});

export type SavePushSubscriptionRequest = z.infer<
    typeof SavePushSubscriptionSchema
>;

export const PushEndpointRequestSchema = z.object({
    endpoint: PushEndpointField,
});

export const PushSubscriptionIdRequestSchema = z.object({
    id: z.coerce.number().int().positive("Pick a device"),
});
