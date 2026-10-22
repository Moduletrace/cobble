/**
 * Generation settings a harness can ask its model for. Each is saved in the
 * setting's `options` (next to `voice`) and only sent to a model whose
 * catalog entry advertises it: a fallback model that rejects a field would
 * fail otherwise.
 *
 * - `key`: the option's key in `options`, and the field sent on the wire
 * - `advertised`: the name a provider's model list uses for it, when it
 *   differs (OpenRouter's `supported_parameters`)
 * - `wire`: how the field is written, for providers that nest it
 */
export const HarnessParameters = [
    {
        key: "temperature",
        title: "Temperature",
        description: `Lower keeps a bot literal and repeatable, higher makes it more varied. Most models default to 1, which makes small bots invent details.`,
        value_type: "number",
        min: 0,
        max: 2,
        step: 0.05,
    },
    {
        key: "top_p",
        title: "Top P",
        description: `Nucleus sampling: how much of the model's probability mass it may pick from. Change this or temperature, rarely both.`,
        value_type: "number",
        min: 0,
        max: 1,
        step: 0.05,
    },
    {
        key: "top_k",
        title: "Top K",
        description: `How many of the likeliest tokens it may pick from. 0 turns it off. Not every provider takes it.`,
        value_type: "number",
        min: 0,
        max: 200,
        step: 1,
    },
    {
        key: "min_p",
        title: "Min P",
        description: `Drops tokens less likely than this share of the best token. Alternative to top_p.`,
        value_type: "number",
        min: 0,
        max: 1,
        step: 0.01,
    },
    {
        key: "top_a",
        title: "Top A",
        description: `Drops tokens the model is only weakly considering. 0 turns it off.`,
        value_type: "number",
        min: 0,
        max: 1,
        step: 0.01,
    },
    {
        key: "frequency_penalty",
        title: "Frequency penalty",
        description: `Positive values make it repeat words less. Negative values make it repeat more.`,
        value_type: "number",
        min: -2,
        max: 2,
        step: 0.1,
    },
    {
        key: "presence_penalty",
        title: "Presence penalty",
        description: `Positive values push it toward new topics, negative values back to what was already said.`,
        value_type: "number",
        min: -2,
        max: 2,
        step: 0.1,
    },
    {
        key: "repetition_penalty",
        title: "Repetition penalty",
        description: `1 leaves repetition alone, higher penalizes it. Some providers take this instead of the two penalties above.`,
        value_type: "number",
        min: 0,
        max: 2,
        step: 0.05,
    },
    {
        key: "seed",
        title: "Seed",
        description: `Asks for repeatable answers. Providers only do their best: the same seed usually gives the same answer, not always.`,
        value_type: "number",
        min: 0,
        step: 1,
    },
    {
        key: "reasoning_effort",
        title: "Reasoning effort",
        description: `How long a reasoning model thinks before it answers. "Default" leaves the provider's own setting alone. Models without reasoning ignore it.`,
        value_type: "select",
        advertised: "reasoning",
        wire: "reasoning",
        options: [
            { value: "minimal", title: "Minimal" },
            { value: "low", title: "Low" },
            { value: "medium", title: "Medium" },
            { value: "high", title: "High" },
        ],
    },
] as const;

export type HarnessParameter = (typeof HarnessParameters)[number];
export type HarnessParameterKey = HarnessParameter["key"];
export type HarnessParameterValue = number | string;

/**
 * The harnesses whose models are chat models, so the only ones the
 * generation settings apply to.
 */
export const HarnessParameterHarnesses = ["text", "vision"] as const;

export const HarnessParameterKeys = HarnessParameters.map((parameter) => parameter.key);

/**
 * What each chat harness uses when nobody set anything, so a fresh install
 * is ready to go: bots are literal and repeatable (`Cobble`'s job is doing
 * the work it was asked for, not improvising), while media reading is a
 * lookup, so it stays at 0.
 */
export const HarnessParameterDefaults: Partial<
    Record<
        (typeof HarnessParameterHarnesses)[number],
        Partial<Record<HarnessParameterKey, HarnessParameterValue>>
    >
> = {
    text: { temperature: 0.3 },
    vision: { temperature: 0 },
};

/**
 * One setting's value when the harness's own has none.
 */
export function harnessParameterDefault({
    harness,
    key,
}: {
    harness: (typeof HarnessParameterHarnesses)[number];
    key: HarnessParameterKey;
}) {
    return HarnessParameterDefaults[harness]?.[key];
}

/**
 * A setting's value for a harness: what it was saved as, else the app's
 * default. `saved` says which, since a default is only used on a model
 * that says it takes the field (a saved one is sent to any model whose
 * catalog doesn't rule it out).
 */
export function harnessParameterValue({
    harness,
    params,
    key,
}: {
    harness: (typeof HarnessParameterHarnesses)[number];
    params?: Record<string, unknown>;
    key: HarnessParameterKey;
}): { value?: HarnessParameterValue; saved: boolean } {
    const saved = params?.[key];

    if (typeof saved == "number" || (typeof saved == "string" && saved)) {
        return { value: saved, saved: true };
    }

    return { value: harnessParameterDefault({ harness, key }), saved: false };
}

/**
 * Whether a model's provider says it takes a setting (no guessing).
 */
export function modelAdvertisesParameter({
    parameter,
    supported,
}: {
    parameter: HarnessParameter;
    supported?: string[];
}) {
    return Boolean(
        supported?.includes(
            "advertised" in parameter ? parameter.advertised : parameter.key,
        ),
    );
}

/**
 * The generation settings a saved `options` object holds.
 */
export function harnessParametersFromOptions({
    options,
}: {
    options: Record<string, unknown>;
}): Partial<Record<HarnessParameterKey, HarnessParameterValue>> {
    return Object.fromEntries(
        HarnessParameters.flatMap((parameter) => {
            const value = options[parameter.key];

            return typeof value == "number" || (typeof value == "string" && value)
                ? [[parameter.key, value]]
                : [];
        }),
    );
}

/**
 * A `options` object with the given generation settings replaced (and the
 * ones missing from it removed), keeping everything else (`voice`).
 */
export function withHarnessParameters({
    options,
    params,
}: {
    options: Record<string, unknown>;
    params: Partial<Record<HarnessParameterKey, HarnessParameterValue>>;
}): Record<string, unknown> {
    const rest: Record<string, unknown> = Object.fromEntries(
        Object.entries(options).filter(([key]) => !HarnessParameterKeys.includes(key as HarnessParameterKey)),
    );

    return { ...rest, ...params };
}

/**
 * Whether a model advertises a setting. A model whose provider lists no
 * parameters (anything but OpenRouter) is taken to accept them all.
 */
export function modelTakesParameter({
    parameter,
    supported,
}: {
    parameter: HarnessParameter;
    supported?: string[];
}) {
    if (!supported?.length) return true;

    return supported.includes(
        "advertised" in parameter ? parameter.advertised : parameter.key,
    );
}
