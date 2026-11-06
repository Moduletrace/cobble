/**
 * The flags whose values Chrome reads only once: a second
 * `--disable-features=` replaces the first, so the agent's own list and the
 * user's extra flags would drop each other.
 */
const FeatureFlags = ["--disable-features", "--enable-features"];

/**
 * Chrome's flags with every `--disable-features=` (and `--enable-features=`)
 * folded into one flag, at the first one's place, each feature kept once in
 * the order given.
 */
export default function mergeFeatureFlags({ args }: { args: string[] }) {
    const features = new Map<string, string[]>();
    const merged: string[] = [];

    for (const arg of args) {
        const flag = FeatureFlags.find((name) => arg.startsWith(`${name}=`));

        if (!flag) {
            merged.push(arg);
            continue;
        }

        const values = arg
            .slice(flag.length + 1)
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean);

        if (!features.has(flag)) {
            features.set(flag, []);
            merged.push(flag);
        }

        const list = features.get(flag)!;

        for (const value of values) if (!list.includes(value)) list.push(value);
    }

    return merged
        .map((arg) => (features.has(arg) ? `${arg}=${features.get(arg)!.join(",")}` : arg))
        .filter((arg) => !FeatureFlags.some((flag) => arg == `${flag}=`));
}
