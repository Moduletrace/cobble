/**
 * A task was stopped because it ran past its deadline (`withTimeout`).
 * Its message is safe to show: it says what ran too long, not internals.
 */
export default class TaskTimeoutError extends Error {
    constructor({ message }: { message: string }) {
        super(message);
        this.name = "TaskTimeoutError";
    }
}
