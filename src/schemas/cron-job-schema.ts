import { z } from "zod";

const CronJobIdField = z.coerce.number().int().positive("Pick a routine");

export const UpdateCronJobRequestSchema = z.object({
    cron_job_id: CronJobIdField,
    title: z.string().trim().min(1, "Give the routine a name").max(80, "Keep the name under 80 characters").optional(),
    instructions: z.string().trim().min(1, "Tell the bot what to do").max(8000).optional(),
    schedule: z.string().trim().min(1, "Set when it runs").max(100).optional(),
    enabled: z.boolean().optional(),
});

export type UpdateCronJobRequest = z.infer<typeof UpdateCronJobRequestSchema>;

export const CronJobIdRequestSchema = z.object({
    cron_job_id: CronJobIdField,
});

export type CronJobIdRequest = z.infer<typeof CronJobIdRequestSchema>;

export const HandOverCronJobRequestSchema = z.object({
    cron_job_id: CronJobIdField,
    bot_id: z.coerce.number().int().positive("Pick a bot"),
});

export type HandOverCronJobRequest = z.infer<typeof HandOverCronJobRequestSchema>;
