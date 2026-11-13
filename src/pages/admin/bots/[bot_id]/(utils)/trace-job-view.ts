import type { TWUIButtonColorType } from "@moduletrace/twui/layout/Button";
import type { BotTraceJob } from "@/src/types";

export type TraceJobView = {
    /**
     * What the run was asked to do, or what it was: a task's title or the
     * reply it wrote.
     */
    title: string;
    kind_label: string;
    status_label: string;
    status_color: TWUIButtonColorType;
};

const StatusViews: Record<string, { label: string; color: TWUIButtonColorType }> = {
    pending: { label: "queued", color: "gray" },
    processing: { label: "running", color: "primary" },
    completed: { label: "finished", color: "success" },
    failed: { label: "failed", color: "error" },
};

/**
 * A traced run as the debug view heads it: what it was, the state it was
 * left in, and nothing of the job's own bookkeeping.
 */
export default function traceJobView({ job }: { job: BotTraceJob }): TraceJobView {
    const status = StatusViews[job.status] || {
        label: job.status || "unknown",
        color: "gray" as TWUIButtonColorType,
    };

    return {
        title:
            job.title ||
            (job.kind == "task" ? "Task run" : job.kind == "reply" ? "Reply" : "Run"),
        kind_label: job.kind == "task" ? "task" : job.kind == "reply" ? "reply" : job.kind,
        status_label: status.label,
        status_color: status.color,
    };
}