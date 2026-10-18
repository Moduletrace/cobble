/**
 * # App Error
 * An error whose message is safe to show to the client. Anything else is
 * treated as internal and replaced with a generic message at the API edge.
 */
export default class AppError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "AppError";
    }
}
