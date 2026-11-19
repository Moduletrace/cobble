import { describe, expect, test } from "bun:test";
import HarnessError from "../../harness-error";
import smallerBatchLimit from "./smaller-batch-limit";

const refusal = ({ message, status = 400 }: { message: string; status?: number }) =>
    new HarnessError({ message, status });

describe("smallerBatchLimit", () => {
    test("takes the limit the provider stated", () => {
        expect(
            smallerBatchLimit({
                error: refusal({
                    message:
                        "Alibaba Cloud: <400> InternalError.Algo.InvalidParameter: Value error, batch size is invalid, it should not be larger than 20.: input.contents",
                }),
                size: 32,
            }),
        ).toBe(20);
    });

    test("halves the batch when no number is named", () => {
        expect(
            smallerBatchLimit({ error: refusal({ message: "batch size is invalid" }), size: 32 }),
        ).toBe(16);
    });

    test("understands the other wordings providers use", () => {
        expect(
            smallerBatchLimit({ error: refusal({ message: "too many inputs in the batch" }), size: 10 }),
        ).toBe(5);
        expect(
            smallerBatchLimit({ error: refusal({ message: "the batch size is at most 4" }), size: 10 }),
        ).toBe(4);
    });

    test("one text alone is never shrunk", () => {
        expect(
            smallerBatchLimit({
                error: refusal({ message: "batch size is invalid, it should not be larger than 0" }),
                size: 1,
            }),
        ).toBeNull();
    });

    test("a stated limit that doesn't shrink the batch still halves it", () => {
        expect(
            smallerBatchLimit({
                error: refusal({ message: "batch size is invalid, it should not be larger than 32" }),
                size: 32,
            }),
        ).toBe(16);
    });

    test("any other refusal is somebody else's to classify", () => {
        expect(
            smallerBatchLimit({ error: refusal({ message: "model not found" }), size: 32 }),
        ).toBeNull();
        expect(
            smallerBatchLimit({
                error: refusal({ message: "batch size is invalid", status: 500 }),
                size: 32,
            }),
        ).toBeNull();
        expect(smallerBatchLimit({ error: new Error("batch size is invalid"), size: 32 })).toBeNull();
    });
});