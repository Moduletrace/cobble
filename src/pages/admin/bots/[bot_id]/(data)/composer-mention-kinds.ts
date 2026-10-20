/**
 * What the composer can mention, by the character that starts it: `@` a
 * bot (`[bot:ID]`), `#` a workspace (`[workspace:ID]`).
 */
export const ComposerMentionKinds = {
    "@": "bot",
    "#": "workspace",
} as const;

export type ComposerMentionChar = keyof typeof ComposerMentionKinds;
export type ComposerMentionKind = (typeof ComposerMentionKinds)[ComposerMentionChar];

/**
 * The trigger character of a kind.
 */
export function composerMentionChar({ kind }: { kind: ComposerMentionKind }): ComposerMentionChar {
    return kind == "workspace" ? "#" : "@";
}
