import { z } from "zod";
import { UserTypes } from "@/src/dict/user-types-dict";

export const SaveUserRequestSchema = z
    .object({
    /**
     * Updates this user; creates one when not given.
     */
    user_id: z.coerce.number().int().positive().nullish(),
    first_name: z.string().trim().min(1, "Enter their first name").max(100),
    last_name: z.string().trim().max(100).default(""),
    email: z.email("Enter a valid email address"),
    username: z.string().trim().min(3, "Usernames must be at least 3 characters").max(32, "Usernames must be at most 32 characters"),
    /**
     * Required for a new user; on an existing one, empty keeps theirs.
     */
    password: z.string().max(128).default(""),
    confirm_password: z.string().max(128).default(""),
    /**
     * Every user type they should hold (`UserTypes`). Types the actor may
     * not grant or remove (`super_admin`, the assignment matrix) are left
     * as they are.
     */
    user_types: z.array(z.enum(UserTypes.map((type) => type.value))).default([]),
    /**
     * A new profile photo as a base64 data URL; left out keeps theirs.
     */
    image: z.string().startsWith("data:image/", "Pick an image").nullish(),
    /**
     * Every worker assigned to them and every workspace they're in,
     * replacing the old lists. Left out: unchanged.
     */
    bot_ids: z.array(z.coerce.number().int().positive()).optional(),
    workspace_ids: z.array(z.coerce.number().int().positive()).optional(),
    })
    .refine((data) => data.password == data.confirm_password, {
        message: "The passwords don't match",
        path: ["confirm_password"],
    });

export type SaveUserRequest = z.infer<typeof SaveUserRequestSchema>;

export const UserIdRequestSchema = z.object({
    user_id: z.coerce.number().int().positive("Pick a user"),
});

export type UserIdRequest = z.infer<typeof UserIdRequestSchema>;
