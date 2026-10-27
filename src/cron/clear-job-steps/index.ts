import clearFinishedJobSteps from "@/src/functions/backend/db/bots-queue/clear-finished-job-steps";

/**
 * Clears the steps of jobs that have ended (`clearFinishedJobSteps`).
 */
export default async function cronClearJobSteps() {
    return await clearFinishedJobSteps();
}
