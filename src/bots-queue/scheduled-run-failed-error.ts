/**
 * Thrown by a task runner when a scheduled run reported that it failed
 * (`report_run_failed`). Unlike `BotJobFatalError`, the queue retries it.
 */
export default class ScheduledRunFailedError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ScheduledRunFailedError";
    }
}
