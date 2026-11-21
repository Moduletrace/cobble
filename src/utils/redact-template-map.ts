import hasEnvTemplate from "./has-env-template";

type Params = {
    /**
     * Header or env names to their values, as a row stores them.
     */
    values: Record<string, string>;
    /**
     * What these are, for the line that names each one left out: "header",
     * "env".
     */
    label: string;
};

type Result = {
    /**
     * The entries a bundle carries: every one written as an env template
     * (`{{env.KEY}}`), which travels as it is, and any left empty.
     */
    values: Record<string, string>;
    /**
     * The ones left out, named, e.g. "header Authorization".
     */
    redacted: string[];
};

/**
 * # Redact Template Map
 * A server's headers or env are the only places a key can be written out
 * instead of templated. A bundle carries the templates and leaves every
 * literal value behind, saying which, so an imported server is never
 * handed someone else's key (and a file on a disk holds none).
 */
export default function redactTemplateMap({ values, label }: Params): Result {
    const kept: Record<string, string> = {};
    const redacted: string[] = [];

    for (const [key, value] of Object.entries(values)) {
        if (value && !hasEnvTemplate({ values: [value] })) {
            redacted.push(`${label} ${key}`);
            continue;
        }

        kept[key] = value;
    }

    return { values: kept, redacted };
}