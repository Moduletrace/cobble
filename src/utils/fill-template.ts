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
 * `{{env.KEY}}` alone, for the arguments a tool is called with: they are
 * filled the same way its template is, but a `{{args.x}}` written inside
 * one of them has nothing to read and stays as written.
 */
export const EnvPattern = /\{\{\s*env\.([A-Za-z0-9_.-]+)\s*\}\}/g;

/**
 * One env's value for a template, with the one wording every template uses
 * when it names a key that isn't set.
 */
export function envTemplateValue({ key, envs }: { key: string; envs: { key: string; value: string }[] }) {
    const env = envs.find((e) => e.key == key);

    if (!env) throw new Error(`The env ${key} isn't set. Add it in Settings, under Environment.`);

    return env.value;
}

/**
 * Fills a custom tool's or MCP server's template: `{{args.x}}` from the
 * model's arguments, `{{env.KEY}}` from the envs. Anything else is left as
 * written.
 */
export default function fillTemplate({ template, args = {}, envs = [], encode = (v) => v }: Params) {
    return template.replace(Pattern, (_match, source: string, path: string) => {
        if (source == "env") return envTemplateValue({ key: path, envs });

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
