import { describe, expect, test } from "bun:test";
import type { BotTraceJob } from "@/src/types";
import traceJobView from "./trace-job-view";

function job(overrides: Partial<BotTraceJob>): BotTraceJob {
    return {
        id: 1,
        kind: "reply",
        title: null,
        status: "completed",
        created_at: 0,
        traces: [],
        ...overrides,
    };
}

describe("traceJobView", () => {
    test("a titled task reads by its title", () => {
        expect(
            traceJobView({ job: job({ kind: "task", title: "Quarterly report", status: "processing" }) }),
        ).toEqual({
            title: "Quarterly report",
            kind_label: "task",
            status_label: "running",
            status_color: "primary",
        });
    });

    test("a reply with no title is a reply", () => {
        expect(traceJobView({ job: job({}) })).toMatchObject({
            title: "Reply",
            kind_label: "reply",
            status_label: "finished",
            status_color: "success",
        });
    });

    test("a failed run says failed, a queued one says queued", () => {
        expect(traceJobView({ job: job({ status: "failed" }) })).toMatchObject({
            status_label: "failed",
            status_color: "error",
        });
        expect(traceJobView({ job: job({ status: "pending" }) })).toMatchObject({
            status_label: "queued",
            status_color: "gray",
        });
    });

    test("a status it doesn't know reads as itself", () => {
        expect(traceJobView({ job: job({ status: "cancelled" }) })).toMatchObject({
            status_label: "cancelled",
            status_color: "gray",
        });
    });
});