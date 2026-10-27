import BunSQLite from "@moduletrace/bun-sqlite";
import { AppData } from "@/src/data/app-data";
import clearFinishedJobStepsSql from "./clear-finished-job-steps-sql";

/**
 * Clears the steps of jobs that ended more than `AppData.BotJobStepsKeepMs`
 * ago, however they ended (completed, failed, cancelled, stopped, lost).
 * Steps only feed the live working row; once the job's message is in they
 * have no reader, and the job keeps their count. Not done the moment a job
 * ends: steps reach the page only through the live relay, which would
 * miss the last ones.
 */
export default async function clearFinishedJobSteps() {
    const { count, clear } = clearFinishedJobStepsSql({
        before: Date.now() - AppData.BotJobStepsKeepMs,
    });

    await BunSQLite.sql(count);

    return await BunSQLite.sql(clear);
}
