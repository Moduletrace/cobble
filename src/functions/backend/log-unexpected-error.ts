import { logError } from "./logger";

type Params = {
    error: unknown;
};

/**
 * Writes an error nobody meant to show (anything but an `AppError`) to the
 * logs, so a failure the client only sees as "Something went wrong" is
 * still on the Activity page with its stack. Never during tests, which
 * throw plain errors on purpose, and never throws.
 */
export default function logUnexpectedError({ error }: Params) {
    if (process.env.NODE_ENV == "test") return;

    const name = error instanceof Error ? error.name : typeof error;

    void logError({
        title: `Unexpected server error (${name})`,
        error,
    }).catch(() => {});
}
