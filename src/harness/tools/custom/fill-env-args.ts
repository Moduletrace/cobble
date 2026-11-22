import { EnvPattern, envTemplateValue } from "@/src/utils/fill-template";

type Env = { key: string; value: string };

type Params = {
    /**
     * The arguments the model sent the tool.
     */
    value: unknown;
    /**
     * What `{{env.KEY}}` reads. A secret fills in as its `[KEY]` marker here
     * when the value would otherwise reach the model; the caller decides.
     */
    envs: Env[];
};

/**
 * Fills `{{env.KEY}}` in the arguments a custom tool is called with
 * (strings, and strings inside objects and arrays), the same way its
 * template is filled. The run is told `{{env.KEY}}` is how a tool reads an
 * env, so an argument written that way is the documented way to pass a
 * secret, not a literal string; a tool that never filled it in sent
 * `{{env.KEY}}` to the server or the script and failed.
 *
 * A key that isn't set throws naming it: better a clear refusal than a
 * credential sent as that literal text.
 */
export default function fillEnvArgs({ value, envs }: Params): unknown {
    if (typeof value == "string") return fillString({ text: value, envs });

    if (Array.isArray(value)) return value.map((item) => fillEnvArgs({ value: item, envs }));

    if (value && typeof value == "object") return fillObject({ value: value as Record<string, unknown>, envs });

    return value;
}

function fillObject({ value, envs }: { value: Record<string, unknown>; envs: Env[] }) {
    const filled: Record<string, unknown> = {};

    for (const [key, item] of Object.entries(value)) {
        filled[key] = fillEnvArgs({ value: item, envs });
    }

    return filled;
}

function fillString({ text, envs }: { text: string; envs: Env[] }) {
    /**
     * Most arguments hold no template at all, and the walk runs over every
     * one of them on every call.
     */
    if (!text.includes("{{")) return text;

    return text.replace(EnvPattern, (_match, key: string) => envTemplateValue({ key, envs }));
}