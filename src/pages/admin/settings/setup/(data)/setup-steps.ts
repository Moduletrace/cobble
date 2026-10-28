/**
 * The setup's steps, in order. Every one can be skipped.
 */
export const SetupSteps = [
    { key: "welcome", title: "Welcome" },
    { key: "provider", title: "Provider" },
    { key: "models", title: "Models" },
    { key: "ready", title: "Ready" },
] as const;

export type SetupStepKey = (typeof SetupSteps)[number]["key"];
