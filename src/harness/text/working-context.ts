import { AppData } from "@/src/data/app-data";
import type { RunLimit } from "@/src/utils/run-limit";

type Params = {
    /**
     * The model's declared window, in tokens
     * (`harness_models.context_length`), left out when its catalog never
     * said.
     */
    context_length?: number | null;
    /**
     * The room the model wants kept for its answer, when it declares one
     * (`harness_models.max_output_tokens`).
     */
    max_output_tokens?: number | null;
    /**
     * An optional tighter cap on the prompt (`grabContextBudgetTokens`).
     * Unlimited or left out, the window decides.
     */
    context_budget?: RunLimit;
};

/**
 * The most a turn may send, and the arithmetic behind it.
 */
export type WorkingContext = {
    /**
     * The window the run works to: the model's own, or
     * `AppData.HarnessUnknownContextWindow` when it never said.
     */
    window: number;
    /**
     * The window is the install's assumption, not the model's own: the
     * provider's refusal is then the only real limit, and the run says so
     * when it hits one.
     */
    assumed: boolean;
    /**
     * Tokens kept back for the model's answer.
     */
    reserve: number;
    /**
     * What a turn may send: the window less the reserve, or less the
     * install's own cap when that is smaller.
     */
    tokens: number;
};

/**
 * The least a run keeps for its answer.
 */
export const WorkingContextReserveMin = 8_000;
/**
 * The most a run keeps for its answer, however big the window: a 1M
 * window does not need a 100,000-token answer.
 */
export const WorkingContextReserveMax = 64_000;
/**
 * The share of the window a run keeps for its answer when the model
 * doesn't say what it needs. This replaced a flat 70% of the window,
 * which turned an assumed 131,072-token window into a 91,750-token
 * working context and left a run's own tool definitions most of it
 * (`over_budget`, then every turn trimmed blind).
 */
export const WorkingContextReserveShare = 0.1;

/**
 * The working context: the model's window less the room its answer
 * needs, or the install's own cap when that is tighter.
 */
export default function workingContextTokens({ context_length, max_output_tokens, context_budget }: Params): WorkingContext {
    const declared = Number(context_length || 0);
    const assumed = !(declared > 0);
    const window = assumed ? AppData.HarnessUnknownContextWindow : declared;
    const reserve =
        Number(max_output_tokens || 0) > 0
            ? Math.min(Number(max_output_tokens), Math.max(1, window - 1))
            : Math.min(
                  WorkingContextReserveMax,
                  Math.max(WorkingContextReserveMin, Math.round(window * WorkingContextReserveShare)),
              );
    const from_window = Math.max(1, window - reserve);
    const cap = typeof context_budget == "number" && context_budget > 0 ? context_budget : 0;

    return {
        window,
        assumed,
        reserve,
        tokens: cap ? Math.min(from_window, cap) : from_window,
    };
}
