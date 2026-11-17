type Params = {
    text: string;
    /**
     * Secret values by the key they're shown as.
     */
    secrets: { key: string; value: string }[];
};

/**
 * Replaces every secret value in `text` with `[KEY]`, longest first so a
 * value inside another is never half replaced. Values under 3 characters
 * are left alone: a one or two letter code matches ordinary text
 * everywhere, and masking those would hide the result instead of the
 * secret. A three character code (a short PIN, a country code) is masked,
 * since it is the shortest thing that is still a secret.
 */
export default function redactSecrets({ text, secrets }: Params) {
    const usable = secrets
        .filter((secret) => secret.value.length >= 3)
        .sort((a, b) => b.value.length - a.value.length);

    let redacted = text;

    for (const secret of usable) {
        redacted = redacted.split(secret.value).join(`[${secret.key}]`);
    }

    return redacted;
}
