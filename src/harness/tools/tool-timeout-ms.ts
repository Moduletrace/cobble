import { AppData } from "@/src/data/app-data";
import type { HarnessTool } from "../types";

/**
 * One tool call's deadline: the tool's own (`HarnessTool.timeout_ms`) when
 * it names one, `null` meaning none at all (`computer_bash`: a script may
 * run for hours), else the install's cap for every tool
 * (`AppData.HarnessToolTimeoutMs`). Only the run's own cancellation, the
 * job's deadline or Stop end a call with no deadline.
 */
export default function toolTimeoutMs({ tool }: { tool: HarnessTool<any> }): number | null {
    if (tool.timeout_ms === undefined) return AppData.HarnessToolTimeoutMs;

    return tool.timeout_ms;
}