import { afterAll, describe, expect, test } from "bun:test";
import pickReachableAddress from "./pick-reachable-address";

const server = Bun.serve({ port: 0, fetch: () => new Response("", { status: 404 }) });
const reachable = `http://127.0.0.1:${server.port}`;
const unreachable = "http://cobble-computer-test.invalid:8080";

afterAll(() => server.stop(true));

describe("pickReachableAddress", () => {
    test("falls back to the next address when the first can't be reached", async () => {
        expect(await pickReachableAddress({ key: "a", candidates: [unreachable, reachable] })).toBe(reachable);
    });

    test("keeps the first address when it answers, whatever the status", async () => {
        expect(await pickReachableAddress({ key: "b", candidates: [reachable, unreachable] })).toBe(reachable);
    });

    test("returns the first address when none answers", async () => {
        expect(await pickReachableAddress({ key: "c", candidates: [unreachable, "http://127.0.0.1:1"] })).toBe(unreachable);
    });

    test("returns a lone address without trying it", async () => {
        expect(await pickReachableAddress({ key: "d", candidates: [unreachable] })).toBe(unreachable);
    });
});
