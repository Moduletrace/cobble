import { z } from "zod";

export const ProfileImageTargets = ["bot", "workspace"] as const;

export type ProfileImageTarget = (typeof ProfileImageTargets)[number];

export const SetProfileImageRequestSchema = z.object({
    target: z.enum(ProfileImageTargets),
    id: z.coerce.number().int().positive(),
    /**
     * The picture as a base64 data URL; null removes it.
     */
    data_url: z.string().startsWith("data:image/", "Pick an image").nullable(),
});

export type SetProfileImageRequest = z.infer<typeof SetProfileImageRequestSchema>;
