import { z } from "zod";

const IdentifierSchema = z
    .string()
    .trim()
    .min(1, "Please enter your email or username")
    .max(320);

export const PasswordLoginRequestSchema = z.object({
    login: z.object({
        email_or_username: IdentifierSchema,
        password: z
            .string()
            .min(1, "Please enter your password")
            .max(128),
    }),
});

export const SignupRequestSchema = z.object({
    signup: z.object({
        first_name: z
            .string()
            .trim()
            .min(1, "Please enter your first name")
            .max(100),
        last_name: z.string().trim().max(100).optional(),
        username: z
            .string()
            .trim()
            .min(3, "Usernames must be at least 3 characters")
            .max(32, "Usernames must be at most 32 characters"),
        email: z.email("Please enter a valid email address"),
        password: z.string().min(1, "Please enter a password").max(128),
    }),
});

export const GoogleLoginRequestSchema = z.object({
    google_token: z.string().min(1, "No Google token was provided"),
});
