/**
 * Starts the development server over HTTPS, generating the certificate
 * first, so a phone on the VPN can open the app in one command:
 *
 *   bun run dev:phone -- --host <the VPN name>
 *
 * Without `--host` the machine's own name and addresses are used. The
 * files land in `certs/` (gitignored); `bun run dev` picks them up on its
 * own afterwards.
 */

const args = process.argv.slice(2);

const generated = Bun.spawnSync({
    cmd: [
        process.execPath,
        "src/scripts/generate-local-certs.ts",
        "--out",
        "certs",
        ...args,
    ],
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
});

if (!generated.success) process.exit(generated.exitCode ?? 1);

const port = process.env.PORT || "7227";

console.log(
    `\nPhone setup: open https://<a name above>:${port}/ca.mobileconfig first,\n` +
        `then the app at the same address. Trust the profile on the device.\n`,
);

const server = Bun.spawnSync({
    cmd: [process.execPath, "src/server.ts"],
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
    env: {
        ...process.env,
        TLS_CERT_FILE: "certs/server.crt",
        TLS_KEY_FILE: "certs/server.key",
        TLS_CA_FILE: "certs/ca.crt",
    },
});

process.exit(server.exitCode ?? 0);
