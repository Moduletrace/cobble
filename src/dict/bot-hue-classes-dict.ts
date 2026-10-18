import type { BotHue } from "./bot-dict";

/**
 * Static Tailwind class names per hue, so the classes survive the build.
 */
export const BotHueFillClasses: Record<BotHue, string> = {
    ember: "fill-hue-ember",
    amber: "fill-hue-amber",
    moss: "fill-hue-moss",
    teal: "fill-hue-teal",
    cobalt: "fill-hue-cobalt",
    violet: "fill-hue-violet",
    rose: "fill-hue-rose",
};

export const BotHueBgClasses: Record<BotHue, string> = {
    ember: "bg-hue-ember",
    amber: "bg-hue-amber",
    moss: "bg-hue-moss",
    teal: "bg-hue-teal",
    cobalt: "bg-hue-cobalt",
    violet: "bg-hue-violet",
    rose: "bg-hue-rose",
};
