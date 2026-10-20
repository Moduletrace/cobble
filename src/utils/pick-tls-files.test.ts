import { describe, expect, test } from "bun:test";
import pickTlsFiles from "./pick-tls-files";

const fallback = {
    fallback_cert_file: "certs/server.crt",
    fallback_key_file: "certs/server.key",
    fallback_ca_file: "certs/ca.crt",
};

const exists = (paths: string[]) => (path: string) => paths.includes(path);

const pick = (
    options: Partial<Parameters<typeof pickTlsFiles>[0]> = {},
    paths: string[] = ["certs/server.crt", "certs/server.key", "certs/ca.crt"],
) =>
    pickTlsFiles({
        ...fallback,
        file_exists: exists(paths),
        ...options,
    });

describe("pickTlsFiles", () => {
    test("prefers the TLS variables", () => {
        const picked = pick({
            cert_file: "/etc/cert.pem",
            key_file: "/etc/key.pem",
            ca_file: "/etc/ca.pem",
        });

        expect(picked).toEqual({
            cert_file: "/etc/cert.pem",
            key_file: "/etc/key.pem",
            ca_file: "/etc/ca.pem",
            source: "explicit",
        });
    });

    test("uses certs/ when the variables are unset, in any environment", () => {
        const picked = pick({ cert_file: "", key_file: "" });

        expect(picked).toEqual({
            cert_file: "certs/server.crt",
            key_file: "certs/server.key",
            ca_file: "certs/ca.crt",
            source: "fallback",
        });
    });

    test("serves HTTP when the certificate is explicitly disabled", () => {
        expect(
            pick({
                cert_file: "/etc/cert.pem",
                key_file: "/etc/key.pem",
                disabled: "1",
            }),
        ).toEqual({ source: "disabled" });
        expect(pick({ disabled: "true" })).toEqual({ source: "disabled" });
        expect(pick({ disabled: "no" }).source).toBe("fallback");
    });

    test("serves HTTP when there is nothing to serve with", () => {
        expect(pick({}, []).source).toBe("none");
        expect(pick({}, ["certs/server.crt"]).source).toBe("none");
    });

    test("keeps half a configuration for the resolver to reject", () => {
        expect(pick({ cert_file: "/etc/cert.pem" }, []).source).toBe("explicit");
    });
});
