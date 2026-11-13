import { describe, expect, test } from "bun:test";
import computerJson from "./computer-json";

/**
 * The agent answers `/api/exec` with a space every 15 seconds while the
 * command runs (a client that drops a silent connection would otherwise
 * lose it), then the JSON. Leading whitespace is still a JSON document,
 * and this pins that the app reads such an answer.
 */
describe("computerJson", () => {
    test("reads an answer kept alive with heartbeat spaces", async () => {
        const encoder = new TextEncoder();
        const server = Bun.serve({
            port: 0,
            fetch: () =>
                new Response(
                    new ReadableStream({
                        start(controller) {
                            controller.enqueue(encoder.encode(" "));
                            controller.enqueue(encoder.encode(" "));
                            controller.enqueue(encoder.encode(JSON.stringify({ output: "done\n", exit_code: 0, timed_out: false })));
                            controller.close();
                        },
                    }),
                    { headers: { "content-type": "application/json" } },
                ),
        });

        try {
            const result = await computerJson<{ output: string; exit_code: number }>({
                computer: { base_url: `http://127.0.0.1:${server.port}`, token: "computer-token" },
                path: "/api/exec",
                timeout_ms: 5_000,
            });

            expect(result.output).toBe("done\n");
            expect(result.exit_code).toBe(0);
        } finally {
            server.stop(true);
        }
    });

    test("sends the computer's token and its body", async () => {
        let received: { token: string | null; body: unknown } = { token: null, body: null };
        const server = Bun.serve({
            port: 0,
            fetch: async (req) => {
                received = { token: req.headers.get("authorization"), body: await req.json() };
                return Response.json({ ok: true });
            },
        });

        try {
            const result = await computerJson<{ ok: boolean }>({
                computer: { base_url: `http://127.0.0.1:${server.port}`, token: "computer-token" },
                path: "/api/exec",
                body: { command: "ls" },
                timeout_ms: 5_000,
            });

            expect(result.ok).toBe(true);
            expect(received.token).toBe("Bearer computer-token");
            expect(received.body).toEqual({ command: "ls" });
        } finally {
            server.stop(true);
        }
    });

    test("says what the computer refused", async () => {
        const server = Bun.serve({
            port: 0,
            fetch: () => Response.json({ error: "Give the command." }, { status: 400 }),
        });

        try {
            const error = await computerJson({
                computer: { base_url: `http://127.0.0.1:${server.port}`, token: "computer-token" },
                path: "/api/exec",
                timeout_ms: 5_000,
            }).catch((caught: Error) => caught);

            expect(String(error)).toContain("Give the command.");
        } finally {
            server.stop(true);
        }
    });
});