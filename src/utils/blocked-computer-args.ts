type Params = {
    /**
     * Space separated flags, as typed.
     */
    text?: string | null;
    blocked: readonly string[];
};

/**
 * The flags in `text` that are on the `blocked` list (`--name` or
 * `--name=value`, any case), named as the list has them.
 */
export default function blockedComputerArgs({ text, blocked }: Params) {
    const names = String(text || "")
        .split(/\s+/)
        .filter((word) => word.startsWith("-"))
        .map((word) => word.split("=")[0]!.toLowerCase());

    return blocked.filter((name) => names.includes(name));
}
