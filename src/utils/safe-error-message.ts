import AppError from "./app-error";

type Params = {
    error: unknown;
    fallback?: string;
};

/**
 * # Safe Error Message
 * Returns the message of an `AppError` (deliberate, user-facing) and a
 * generic fallback for everything else, so internal details (SQL errors,
 * file paths, stack messages) never reach the client.
 */
export default function safeErrorMessage({
    error,
    fallback = "Something went wrong. Please try again.",
}: Params): string {
    if (error instanceof AppError) {
        return error.message;
    }

    return fallback;
}
