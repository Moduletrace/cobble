/**
 * Throw from a job runner when retrying can't help (bad parameters, no
 * access). The job fails at once instead of using its remaining attempts.
 */
export default class BotJobFatalError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "BotJobFatalError";
    }
}
