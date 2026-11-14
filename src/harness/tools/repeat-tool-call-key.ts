import type { HarnessToolCall } from "../types";
import isReadOnlyCommand from "./computer/read-only-command";
import isRepeatableTool from "./repeatable-tool-names";

/**
 * What makes two calls the same call: the tool and its arguments, whatever
 * order the model wrote their keys in (a model re-reads a file it read
 * before with the same fields in another order). Null for arguments that
 * aren't a JSON object, which `runToolCall` turns down anyway.
 *
 * Every tool has one, not only the reads: a failing call repeated word for
 * word is answered from its failure (`runTextLoop`), since it fails the
 * same way rather than by luck.
 */
export function toolCallKey({ call }: { call: HarnessToolCall }): string | null {
    let args: unknown;

    try {
        args = call.arguments.trim() ? JSON.parse(call.arguments) : {};
    } catch {
        return null;
    }

    if (!args || typeof args != "object" || Array.isArray(args)) return null;

    return `${call.name}:${JSON.stringify(sortKeys({ value: args }))}`;
}

/**
 * What makes two reads the same read: null for a tool whose answer may
 * change (anything with a side effect), which is answered by running it.
 *
 * A shell is the one tool that has to be judged by its command rather than
 * by its name: `cat`, `grep` and `git log` read, everything else may write,
 * so `isReadOnlyCommand` decides and the rest is run again.
 */
export default function repeatToolCallKey({ call }: { call: HarnessToolCall }): string | null {
    if (isRepeatableTool({ name: call.name })) return toolCallKey({ call });

    if (call.name == "computer_bash" && bashReads({ arguments: call.arguments })) {
        return toolCallKey({ call });
    }

    return null;
}

/**
 * Whether a `computer_bash` call's `command` only reads. Arguments that are
 * not the expected object are not a read.
 */
function bashReads({ arguments: text }: { arguments: string }): boolean {
    if (!text.trim()) return false;

    try {
        const args = JSON.parse(text) as { command?: unknown };

        return typeof args?.command == "string" && isReadOnlyCommand({ command: args.command });
    } catch {
        return false;
    }
}

/**
 * The value with every object's keys sorted, so two spellings of the same
 * arguments compare equal.
 */
function sortKeys({ value }: { value: unknown }): unknown {
    if (Array.isArray(value)) return value.map((item) => sortKeys({ value: item }));

    if (value && typeof value == "object") {
        return Object.fromEntries(
            Object.entries(value as Record<string, unknown>)
                .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
                .map(([key, inner]) => [key, sortKeys({ value: inner })]),
        );
    }

    return value;
}