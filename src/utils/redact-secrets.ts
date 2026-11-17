type Params = {
    text: string;
    /**
     * Secret values by the key they're shown as.
     */
    secrets: { key: string; value: string }[];
};

type Form = {
    needle: string;
    key: string;
    /**
     * Match without regard to case (a long value a run may have folded).
     */
    insensitive: boolean;
};

/**
 * Replaces every secret value in `text` with `[KEY]`, longest first so a
 * value inside another is never half replaced. Values under 3 characters
 * are left alone: a one or two letter code matches ordinary text
 * everywhere, and masking those would hide the result instead of the
 * secret. A three character code (a short PIN, a country code) is masked,
 * since it is the shortest thing that is still a secret.
 *
 * A run can print a secret transformed rather than literal, so each value
 * is also masked in its common encodings (base64, base64url, hex and
 * URL-encoded), and a long value is matched without regard to case (L6).
 * This is a mitigation, not a guarantee: a novel transform (a cipher, a
 * split across lines, a hash) still gets past substring redaction, which
 * is why a secret should never reach a run's output in the first place.
 */
export default function redactSecrets({ text, secrets }: Params) {
    const forms: Form[] = [];

    for (const secret of secrets) {
        const value = secret.value;

        if (value.length < 3) continue;

        const bytes = Buffer.from(value, "utf8");
        const variants = new Set<string>([
            value,
            bytes.toString("base64"),
            bytes.toString("base64url"),
            bytes.toString("hex"),
            encodeURIComponent(value),
        ]);

        for (const needle of variants) {
            if (needle.length >= 3) forms.push({ needle, key: secret.key, insensitive: false });
        }

        if (value.length >= 8) forms.push({ needle: value, key: secret.key, insensitive: true });
    }

    forms.sort((a, b) => b.needle.length - a.needle.length);

    let redacted = text;

    for (const form of forms) {
        redacted = form.insensitive
            ? redacted.replace(new RegExp(escapeRegExp({ text: form.needle }), "gi"), `[${form.key}]`)
            : redacted.split(form.needle).join(`[${form.key}]`);
    }

    return redacted;
}

function escapeRegExp({ text }: { text: string }) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}