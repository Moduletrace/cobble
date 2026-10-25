import AppError from "./app-error";
import logUnexpectedError from "@/src/functions/backend/log-unexpected-error";

type Params = {
    error: unknown;
    fallback?: string;
    /**
     * Write an unexpected error to the logs. Off where the caller already
     * logs it.
     */
    log?: boolean;
};

/**
 * # Safe Error Message
 * Returns the message of an `AppError` (deliberate, user-facing) and a
 * generic fallback for everything else, so internal details (SQL errors,
 * file paths, stack messages) never reach the client. The unexpected ones
 * are logged (`logUnexpectedError`), since the client never sees why.
 */
export default function safeErrorMessage({
    error,
    fallback = "Something went wrong. Please try again.",
    log = true,
}: Params): string {
    if (error instanceof AppError) {
        return error.message;
    }

    if (log) logUnexpectedError({ error });

    return fallback;
}
