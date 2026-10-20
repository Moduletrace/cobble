import { afterAll, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "fs";
import os from "os";
import path from "path";
import resolveTlsOptions from "./resolve-tls-options";

const dir = mkdtempSync(path.join(os.tmpdir(), "cobble-tls-"));
const cert = path.join(dir, "server.crt");
const key = path.join(dir, "server.key");

writeFileSync(cert, "certificate");
writeFileSync(key, "key");

afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("resolveTlsOptions", () => {
    test("plain HTTP when neither is set", () => {
        expect(resolveTlsOptions({})).toBeUndefined();
        expect(
            resolveTlsOptions({ cert_file: "", key_file: " " }),
        ).toBeUndefined();
    });

    test("reads both files when they are set", async () => {
        const tls = resolveTlsOptions({ cert_file: cert, key_file: key });

        expect(tls).toBeDefined();
        expect(await tls!.cert.text()).toBe("certificate");
        expect(await tls!.key.text()).toBe("key");
    });

    test("refuses half a configuration", () => {
        expect(() => resolveTlsOptions({ cert_file: cert })).toThrow(
            "TLS_CERT_FILE and TLS_KEY_FILE must both be set, or neither.",
        );
        expect(() => resolveTlsOptions({ key_file: key })).toThrow(
            "TLS_CERT_FILE and TLS_KEY_FILE must both be set, or neither.",
        );
    });

    test("refuses a missing file", () => {
        expect(() =>
            resolveTlsOptions({
                cert_file: path.join(dir, "missing.crt"),
                key_file: key,
            }),
        ).toThrow("Can't read the TLS file");
    });

    test("refuses a directory", () => {
        expect(() =>
            resolveTlsOptions({ cert_file: dir, key_file: key }),
        ).toThrow("Can't read the TLS file");
    });
});
