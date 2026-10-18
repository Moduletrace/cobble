import { z } from "zod";

export const ContactSchema = z.object({
    name: z.string().trim().min(1, "Please enter your name").max(200),
    email: z.email("Please enter a valid email address"),
    subject: z.string().trim().max(200).optional(),
    message: z.string().trim().min(1, "Please enter a message").max(5000),
});

export const ContactRequestSchema = z.object({
    contact: ContactSchema,
});
