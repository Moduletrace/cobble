type Params = {
    template: string;
    /**
     * `{{args.name}}`, dotted paths reach into objects. Missing ones fill
     * in empty; objects and arrays as JSON.
     */
    args?: Record<string, unknown>;
    /**
     * `{{env.KEY}}`. A key that isn't set throws, naming it.
     */
    envs?: { key: string; value: string }[];
    /**
     * Applied to every filled-in argument, e.g. `encodeURIComponent` in a
     * URL. Envs go in as they are (one may hold a whole base URL).
     */
    encode?: (value: string) => string;
};

const Pattern = /\{\{\s*(args|env)\.([A-Za-z0-9_.-]+)\s*\}\}/g;

/**
 * Fills a custom tool's or MCP server's template: `{{args.x}}` from the
 * model's arguments, `{{env.KEY}}` from the envs. Anything else is left as
 * written.
 */
export default function fillTemplate({ template, args = {}, envs = [], encode = (v) => v }: Params) {
    return template.replace(Pattern, (_match, source: string, path: string) => {
        if (source == "env") {
            const env = envs.find((e) => e.key == path);

            if (!env) throw new Error(`The env ${path} isn't set. Add it in Settings, under Environment.`);

            return env.value;
        }

        return encode(stringify({ value: pick({ value: args, path }) }));
    });
}

function pick({ value, path }: { value: unknown; path: string }) {
    return path.split(".").reduce<unknown>((current, key) => {
        if (current && typeof current == "object") return (current as Record<string, unknown>)[key];
        return undefined;
    }, value);
}

function stringify({ value }: { value: unknown }) {
    if (value === undefined || value === null) return "";
    if (typeof value == "string") return value;
    if (typeof value == "number" || typeof value == "boolean") return String(value);

    return JSON.stringify(value);
}
