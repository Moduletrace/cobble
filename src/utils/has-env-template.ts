type Params = {
    values: (string | undefined | null)[];
};

/**
 * Whether any of these texts reads an env (`{{env.KEY}}`), matched more
 * loosely than `fillTemplate` (any case and spacing) so a near miss never
 * slips through. Bots can't write one: an env holds a secret the app fills
 * in on the way out, so a bot that could place one could send it anywhere.
 */
export default function hasEnvTemplate({ values }: Params) {
    return values.some((value) => /\{\{\s*env\s*\./i.test(value || ""));
}
