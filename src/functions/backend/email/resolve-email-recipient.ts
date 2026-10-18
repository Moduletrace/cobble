type Params = {
    /**
     * The real recipient, used in production
     */
    to: string;
};

/**
 * Outside production, all outgoing mail is redirected to
 * `DEV_EMAIL_RECIPIENT` so real users never get test emails. Returns
 * `undefined` when no dev recipient is configured - callers should skip
 * sending in that case.
 */
export default function resolveEmailRecipient({
    to,
}: Params): string | undefined {
    if (process.env.NODE_ENV == "production") {
        return to;
    }

    return process.env.DEV_EMAIL_RECIPIENT || undefined;
}
