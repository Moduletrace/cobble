import { EnvDict, EnvKeyRegex, ProcessOnlyEnvKeys } from "@/src/dict/env-dict";
import AppError from "./app-error";

type Params = {
    key: string;
};

/**
 * The key a personal secret is saved under, trimmed: a shell variable
 * name, and never one of the app's own settings or process-only keys.
 * Throws why otherwise.
 */
export default function checkSecretKey({ key }: Params) {
    const final_key = key.trim();

    if (!EnvKeyRegex.test(final_key)) {
        throw new AppError(`Use letters, digits and underscores for the key, starting with a letter or underscore.`);
    }

    if (
        (ProcessOnlyEnvKeys as readonly string[]).includes(final_key) ||
        EnvDict.some((env) => env.key == final_key)
    ) {
        throw new AppError(`${final_key} is one of the app's own settings. Pick another key.`);
    }

    return final_key;
}
