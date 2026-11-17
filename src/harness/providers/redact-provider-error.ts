/**
 * A provider's error text is shown to members (a reply's Details modal),
 * written to the logs, and fed back to the next model. Some providers echo
 * the request's key in it - LiteLLM returns the whole key on a 401 - so a
 * credential must never ride out in an error message. The key's value isn't
 * known here, so this masks the shapes a key takes: a `Bearer` token, a
 * prefixed key (`sk-`, `key-`), a key-like JSON field's value, and any bare
 * run long enough to be a token rather than a word (M8).
 */
const Patterns: Array<[RegExp, string]> = [
    [/(Bearer\s+)[A-Za-z0-9._~+/=-]+/gi, "$1[redacted]"],
    [/\b(?:sk|key|pk|apikey|secret)-[A-Za-z0-9_-]+/gi, "[redacted]"],
    [/("(?:api_?key|authorization|access_?token|secret|password)"\s*:\s*")[^"]+(")/gi, "$1[redacted]$2"],
    [/\b[A-Za-z0-9_-]{32,}\b/g, "[redacted]"],
];

export default function redactProviderError({ text }: { text: string }): string {
    let redacted = text;

    for (const [pattern, replacement] of Patterns) {
        redacted = redacted.replace(pattern, replacement);
    }

    return redacted;
}
