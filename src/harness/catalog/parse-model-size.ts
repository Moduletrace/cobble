type Params = {
    slug: string;
};

/**
 * Total parameters in billions, read from a model slug
 * (`qwen3-30b-a3b` is 30, `qwen3.8-2.4t-a95b` is 2400). Active-parameter
 * counts (`a3b`) are skipped. Undefined when the slug doesn't say.
 */
export default function parseModelSize({ slug }: Params): number | undefined {
    const name = slug.split("/").pop() || slug;
    const match = name.match(/(?<![a-z0-9.])(\d+(?:\.\d+)?)([bt])(?![a-z])/i);

    if (!match?.[1] || !match[2]) return undefined;

    const size = Number(match[1]);

    return match[2].toLowerCase() == "t" ? size * 1000 : size;
}
