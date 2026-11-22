import { describe, expect, test } from "bun:test";
import fillEnvArgs from "./fill-env-args";

const envs = [
    { key: "MAIL_PASSWORD", value: "s3cret" },
    { key: "MAIL_USER", value: "bot@test.me" },
];

describe("fillEnvArgs", () => {
    test("fills an env named in a string argument", () => {
        expect(fillEnvArgs({ value: "{{env.MAIL_PASSWORD}}", envs })).toBe("s3cret");
    });

    test("fills one inside a longer string, and every occurrence", () => {
        expect(
            fillEnvArgs({
                value: "imap://{{env.MAIL_USER}}:{{ env.MAIL_PASSWORD }}@box/mail",
                envs,
            }),
        ).toBe("imap://bot@test.me:s3cret@box/mail");
    });

    test("walks objects and arrays", () => {
        expect(
            fillEnvArgs({
                value: {
                    password: "{{env.MAIL_PASSWORD}}",
                    to: ["{{env.MAIL_USER}}", "plain@test.me"],
                    nested: { user: "{{env.MAIL_USER}}" },
                    port: 993,
                },
                envs,
            }),
        ).toEqual({
            password: "s3cret",
            to: ["bot@test.me", "plain@test.me"],
            nested: { user: "bot@test.me" },
            port: 993,
        });
    });

    test("leaves text without a template untouched", () => {
        expect(fillEnvArgs({ value: "list_folders", envs })).toBe("list_folders");
        expect(fillEnvArgs({ value: 25, envs })).toBe(25);
        expect(fillEnvArgs({ value: null, envs })).toBeNull();
    });

    test("leaves a template it does not know as written", () => {
        expect(fillEnvArgs({ value: "{{args.anything}}", envs })).toBe("{{args.anything}}");
        expect(fillEnvArgs({ value: '{"a": "{{other}}"}', envs })).toBe('{"a": "{{other}}"}');
    });

    test("a key that isn't set throws, naming it and where to add it", () => {
        expect(() => fillEnvArgs({ value: "{{env.NOPE}}", envs })).toThrow(
            "The env NOPE isn't set. Add it in Settings, under Environment.",
        );
    });

    test("does not fill the same env twice from a previous call", () => {
        const args = { password: "{{env.MAIL_PASSWORD}}" };

        expect(fillEnvArgs({ value: args, envs })).toEqual({ password: "s3cret" });
        expect(fillEnvArgs({ value: args, envs })).toEqual({ password: "s3cret" });
    });
});