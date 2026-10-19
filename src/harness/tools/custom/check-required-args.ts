type Params = {
    /**
     * The tool's JSON schema.
     */
    parameters: Record<string, unknown>;
    args: Record<string, unknown>;
};

/**
 * Throws when the model left out an argument the tool's schema requires.
 * The rest of the schema is the model's to follow: custom tools fill
 * templates, so a wrong type does no harm the call wouldn't show.
 */
export default function checkRequiredArgs({ parameters, args }: Params) {
    const required = Array.isArray(parameters.required) ? parameters.required.map(String) : [];
    const missing = required.filter((key) => args[key] === undefined || args[key] === null || args[key] === "");

    if (missing.length) {
        throw new Error(`Missing required arguments: ${missing.join(", ")}.`);
    }
}
