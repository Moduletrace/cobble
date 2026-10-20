import {
    chmodSync,
    existsSync,
    mkdirSync,
    readFileSync,
    rmSync,
    writeFileSync,
} from "fs";
import os from "os";
import path from "path";
import buildSanList from "../utils/build-san-list";

/**
 * Generates the certificate HTTPS runs on: a local CA and a leaf it signs,
 * so a device trusts the CA once and every re-issued certificate keeps
 * working.
 *
 * The installer runs this inside the app image (which has `openssl`), with
 * the host's own addresses passed in: a container's interfaces are not the
 * host's. Development runs it directly (`bun run gen:certs`), where the
 * machine's own name and addresses are detected.
 *
 * The CA is kept until `--regen`. The leaf is re-issued when the names
 * change or it is within 30 days of expiring, which is what rerunning the
 * installer on an update does.
 *
 * Usage:
 *   bun run gen:certs [--out certs] [--host NAME_OR_IP]... [--no-detect] [--regen]
 */

const CA_DAYS = 3650;
const CERT_DAYS = 397;
const RENEW_BEFORE_SECONDS = 30 * 24 * 60 * 60;

type Options = {
    out: string;
    hosts: string[];
    detect: boolean;
    regen: boolean;
};

function usage() {
    console.log(`Generates the certificate HTTPS runs on.

Usage:
  bun run gen:certs [options]

Options:
  --out DIR      Where to write the files (default certs)
  --host VALUE   A name or IP the certificate covers (repeatable)
  --no-detect    Do not add this machine's own name and addresses
  --regen        Replace the local CA and the certificate
  --help         Show this help

Writes ca.crt, ca.key, server.crt, server.key and sans.txt.`);
}

function fail(message: string): never {
    console.error(message);
    process.exit(1);
}

function parseOptions(): Options {
    const argv = process.argv.slice(2);
    const hosts: string[] = [];
    let out = "certs";
    let detect = true;
    let regen = false;

    const value = (index: number, name: string) => {
        const next = argv[index];

        if (!next || next.startsWith("--")) fail(`${name} needs a value`);

        return next;
    };

    for (let i = 0; i < argv.length; i++) {
        switch (argv[i]) {
            case "--out":
                out = value(++i, "--out");
                break;
            case "--host":
                hosts.push(value(++i, "--host"));
                break;
            case "--no-detect":
                detect = false;
                break;
            case "--regen":
                regen = true;
                break;
            case "--":
                break;
            case "--help":
            case "-h":
                usage();
                process.exit(0);
            default:
                fail(`Unknown option: ${argv[i]}. Use --help.`);
        }
    }

    return { out, hosts, detect, regen };
}

function run(command: string[]): string {
    const result = Bun.spawnSync({
        cmd: command,
        stdout: "pipe",
        stderr: "pipe",
    });

    const stdout = result.stdout?.toString() ?? "";
    const stderr = result.stderr?.toString() ?? "";

    if (!result.success) {
        throw new Error(
            `${command[0]} failed: ${stderr.trim() || stdout.trim() || `exit ${result.exitCode}`}`,
        );
    }

    return stdout;
}

function certSecondsLeft(file: string): number | undefined {
    if (!existsSync(file)) return undefined;

    try {
        const end = run(["openssl", "x509", "-noout", "-enddate", "-in", file])
            .trim()
            .replace(/^notAfter=/, "");
        const time = Date.parse(end);

        if (Number.isNaN(time)) return undefined;

        return (time - Date.now()) / 1000;
    } catch {
        return undefined;
    }
}

function localNames(): { hostname: string; addresses: string[] } {
    const addresses: string[] = [];

    for (const entries of Object.values(os.networkInterfaces())) {
        for (const entry of entries ?? []) {
            if (entry.address) addresses.push(entry.address);
        }
    }

    return { hostname: os.hostname(), addresses };
}

function caConfig(): string {
    return `[req]
distinguished_name = dn
prompt = no
x509_extensions = v3_ca

[dn]
CN = Cobble Local CA

[v3_ca]
basicConstraints = critical,CA:TRUE,pathlen:0
keyUsage = critical,keyCertSign,cRLSign
`;
}

function leafRequestConfig({ common_name }: { common_name: string }): string {
    return `[req]
distinguished_name = dn
prompt = no

[dn]
CN = ${common_name}
`;
}

function leafExtensionsConfig({ sans }: { sans: string }): string {
    return `[v3_leaf]
basicConstraints = critical,CA:FALSE
keyUsage = critical,digitalSignature,keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = ${sans}
`;
}

function main() {
    if (!Bun.which("openssl")) {
        fail(
            "openssl is required to generate the certificate. Install the openssl package and rerun.",
        );
    }

    const options = parseOptions();
    const invalid_host = options.hosts.find(
        (host) => !/^[A-Za-z0-9.*:_-]+$/.test(host),
    );

    if (invalid_host) {
        fail(`--host is not a hostname or IP address: ${invalid_host}`);
    }

    const out = path.resolve(options.out);

    mkdirSync(out, { recursive: true, mode: 0o700 });
    chmodSync(out, 0o700);

    const build = path.join(out, ".build");
    rmSync(build, { recursive: true, force: true });
    mkdirSync(build, { recursive: true, mode: 0o700 });

    const ca_crt = path.join(out, "ca.crt");
    const ca_key = path.join(out, "ca.key");
    const ca_serial = path.join(out, "ca.srl");
    const server_crt = path.join(out, "server.crt");
    const server_key = path.join(out, "server.key");
    const sans_file = path.join(out, "sans.txt");

    if (options.regen) {
        for (const file of [
            ca_crt,
            ca_key,
            ca_serial,
            server_crt,
            server_key,
            sans_file,
        ]) {
            rmSync(file, { force: true });
        }
    }

    const detected: { hostname?: string; addresses?: string[] } = options.detect
        ? localNames()
        : {};
    const sans = buildSanList({
        hostname: detected.hostname,
        addresses: detected.addresses,
        hosts: options.hosts,
    });
    const san_value = sans.join(",");
    const common_name = (
        sans.find(
            (entry) => entry.startsWith("DNS:") && entry != "DNS:localhost",
        ) ?? "DNS:localhost"
    )
        .slice(4)
        .slice(0, 64);

    let ca_created = false;

    if (!existsSync(ca_crt) || !existsSync(ca_key)) {
        rmSync(ca_crt, { force: true });
        rmSync(ca_key, { force: true });
        rmSync(ca_serial, { force: true });

        const config = path.join(build, "ca.cnf");
        writeFileSync(config, caConfig());

        run([
            "openssl",
            "req",
            "-x509",
            "-newkey",
            "rsa:3072",
            "-nodes",
            "-sha256",
            "-days",
            String(CA_DAYS),
            "-keyout",
            ca_key,
            "-out",
            ca_crt,
            "-config",
            config,
        ]);

        ca_created = true;
    }

    const current_sans = existsSync(sans_file)
        ? readFileSync(sans_file, "utf8").trim()
        : "";
    const seconds_left = certSecondsLeft(server_crt);
    const issue_certificate =
        ca_created ||
        !existsSync(server_crt) ||
        !existsSync(server_key) ||
        current_sans != san_value ||
        seconds_left === undefined ||
        seconds_left < RENEW_BEFORE_SECONDS;

    if (issue_certificate) {
        const request_config = path.join(build, "leaf.cnf");
        const extensions = path.join(build, "leaf-ext.cnf");
        const csr = path.join(build, "server.csr");

        writeFileSync(request_config, leafRequestConfig({ common_name }));
        writeFileSync(extensions, leafExtensionsConfig({ sans: san_value }));

        run([
            "openssl",
            "req",
            "-new",
            "-newkey",
            "rsa:2048",
            "-nodes",
            "-sha256",
            "-keyout",
            server_key,
            "-out",
            csr,
            "-config",
            request_config,
        ]);

        run([
            "openssl",
            "x509",
            "-req",
            "-in",
            csr,
            "-CA",
            ca_crt,
            "-CAkey",
            ca_key,
            "-CAcreateserial",
            "-CAserial",
            ca_serial,
            "-days",
            String(CERT_DAYS),
            "-sha256",
            "-extfile",
            extensions,
            "-extensions",
            "v3_leaf",
            "-out",
            server_crt,
        ]);

        writeFileSync(sans_file, `${san_value}\n`);
    }

    run(["openssl", "verify", "-CAfile", ca_crt, server_crt]);

    chmodSync(ca_key, 0o600);
    chmodSync(server_key, 0o600);
    if (existsSync(ca_serial)) chmodSync(ca_serial, 0o600);
    chmodSync(ca_crt, 0o644);
    chmodSync(server_crt, 0o644);
    chmodSync(sans_file, 0o644);

    rmSync(build, { recursive: true, force: true });

    console.log(`Certificate directory: ${out}`);
    console.log(`Covers: ${sans.join(", ")}`);

    if (ca_created) console.log("Created a new local CA and certificate.");
    else if (issue_certificate)
        console.log("Issued a new certificate from the local CA.");
    else console.log("Kept the existing certificate.");

    console.log(
        `certs: ${ca_created ? "created" : issue_certificate ? "renewed" : "unchanged"}`,
    );
}

try {
    main();
} catch (error) {
    fail(error instanceof Error ? error.message : String(error));
}
