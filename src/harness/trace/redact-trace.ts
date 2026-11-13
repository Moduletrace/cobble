import type { HarnessTrace } from "./types";

type Params = {
    trace: HarnessTrace;
    /**
     * Blanks secret values out of the text (`redactSecrets`). A task run
     * passes its computer's, which also holds what the bot captured
     * (`capture_secret`) during this run.
     */
    redact: (text: string) => string;
};

/**
 * The same trace with every piece of text it carries redacted: a tool's
 * arguments and answer, a turn's answer and reasoning, an event's note.
 * The job's own trace is redacted with the run's envs whatever this does
 * (`insertBotJobTrace`), so this only adds the secrets the run discovered
 * as it went.
 */
export default function redactTrace({ trace, redact }: Params): HarnessTrace {
    if (trace.kind == "turn") {
        return {
            ...trace,
            text: trace.text ? redact(trace.text) : trace.text,
            reasoning: trace.reasoning ? redact(trace.reasoning) : trace.reasoning,
            tool_calls: trace.tool_calls.map((call) => ({
                ...call,
                arguments: redact(call.arguments),
            })),
        };
    }

    if (trace.kind == "tool") {
        return {
            ...trace,
            arguments: redact(trace.arguments),
            result: redact(trace.result),
        };
    }

    return { ...trace, text: trace.text ? redact(trace.text) : trace.text };
}