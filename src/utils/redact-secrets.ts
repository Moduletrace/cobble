type Params = {
    text: string;
    /**
     * Secret values by the key they're shown as.
     */
    secrets: { key: string; value: string }[];
};

/**
 * Replaces every secret value in `text` with `[KEY]`, longest first so a
 * value inside another is never half replaced. Values under 4 characters
 * are left alone: too likely to match ordinary text.
 */
export default function redactSecrets({ text, secrets }: Params) {
    const usable = secrets
        .filter((secret) => secret.value.length >= 4)
        .sort((a, b) => b.value.length - a.value.length);

    let redacted = text;

    for (const secret of usable) {
        redacted = redacted.split(secret.value).join(`[${secret.key}]`);
    }

    return redacted;
}
