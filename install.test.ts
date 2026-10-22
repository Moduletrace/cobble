import { describe, expect, test } from "bun:test";
import path from "path";

const ROOT = import.meta.dir;
const INSTALL_SCRIPT = path.join(ROOT, "install.sh");

/**
 * Lifts one marked block out of `install.sh`, so the tests run the real
 * installer code instead of a copy of it that could drift.
 */
async function readMarkedBlock({ name }: { name: string }): Promise<string> {
    const source = await Bun.file(INSTALL_SCRIPT).text();
    const start = `# MARK:${name}\n`;
    const end = `# END:${name}`;
    const from = source.indexOf(start);
    const to = source.indexOf(end);

    expect(from).toBeGreaterThan(-1);
    expect(to).toBeGreaterThan(from);

    return source.slice(from + start.length, to);
}

/** Runs a bash snippet and returns its stdout, failing on any stderr. */
async function runBash({ script }: { script: string }): Promise<string> {
    const proc = Bun.spawn({
        cmd: ["bash", "-c", script],
        stdout: "pipe",
        stderr: "pipe",
    });

    const [stdout, stderr, code] = await Promise.all([
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
        proc.exited,
    ]);

    expect(stderr).toBe("");
    expect(code).toBe(0);

    return stdout.trim();
}

type MountSpecs = {
    env: string;
    data: string;
    backup: string;
};

/** The three mount specs the installer builds for one SELinux state. */
async function runMountSpecs({
    selinux,
}: {
    selinux: boolean;
}): Promise<MountSpecs> {
    const block = await readMarkedBlock({ name: "mount-specs" });

    const script = [
        `ENV_FILE="/opt/cobble/.env"`,
        `DATA_DIR="/opt/cobble/data"`,
        `BACKUP_ARCHIVE_DIR_HOST="/opt/cobble/backups-archives"`,
        `MOUNT_OPTS="${selinux ? "z" : ""}"`,
        block,
        `printf '%s\\n' "$ENV_MOUNT" "$DATA_MOUNT" "$BACKUP_ARCHIVE_MOUNT"`,
    ].join("\n");

    const [env = "", data = "", backup = ""] = (
        await runBash({ script })
    ).split("\n");

    return { env, data, backup };
}

/**
 * Splits a `source:destination[:options]` spec the way docker does, so a
 * destination that accidentally swallowed an option is caught.
 */
function parseMountSpec({ spec }: { spec: string }) {
    const [source = "", destination = "", ...rest] = spec.split(":");

    return { source, destination, options: rest.join(":") };
}

describe("install.sh SELinux detection", () => {
    test("asks for the mount option when SELinux is enforcing", async () => {
        const block = await readMarkedBlock({
            name: "selinux-detection",
        });

        // An enforcing `getenforce` answers before the /sys fallback, so
        // this result does not depend on the machine running the test.
        const script = [
            `OS="Linux"`,
            `getenforce() { printf '%s' "Enforcing"; }`,
            block,
            `printf '%s' "$MOUNT_OPTS"`,
        ].join("\n");

        expect(await runBash({ script })).toBe("z");
    });

    test("asks for no mount option when SELinux is disabled", async () => {
        const block = await readMarkedBlock({
            name: "selinux-detection",
        });

        // Answering `Disabled` makes the block fall through to the
        // /sys/fs/selinux/enforce probe. Shadowing the path check keeps the
        // result the same on an SELinux host and on a plain one.
        const script = [
            `OS="Linux"`,
            `getenforce() { printf '%s' "Disabled"; }`,
            `SELINUX_ENFORCE_FILE="/nonexistent/cobble-test"`,
            block,
            `printf '%s' "$MOUNT_OPTS"`,
        ].join("\n");

        expect(await runBash({ script })).toBe("");
    });
});

describe("install.sh mount specs", () => {
    for (const selinux of [false, true]) {
        const label = selinux ? "with SELinux" : "without SELinux";

        test(`mounts the data directory at /data ${label}`, async () => {
            const { data } = await runMountSpecs({ selinux });
            const { source, destination, options } = parseMountSpec({
                spec: data,
            });

            // The regression: the SELinux option must be its own field.
            // Gluing it onto the destination makes docker mount a
            // directory named "/data,z", so the app keeps its database in
            // its own container layer, every update wipes the install and
            // computer provisioning fails.
            expect(source).toBe("/opt/cobble/data");
            expect(destination).toBe("/data");
            expect(options).toBe(selinux ? "z" : "");
        });

        test(`mounts the backup archive directory ${label}`, async () => {
            const { backup } = await runMountSpecs({ selinux });
            const { source, destination, options } = parseMountSpec({
                spec: backup,
            });

            expect(source).toBe("/opt/cobble/backups-archives");
            expect(destination).toBe("/backups-archives");
            expect(options).toBe(selinux ? "z" : "");
        });

        test(`mounts .env read-only ${label}`, async () => {
            const { env } = await runMountSpecs({ selinux });
            const { source, destination, options } = parseMountSpec({
                spec: env,
            });

            expect(source).toBe("/opt/cobble/.env");
            expect(destination).toBe("/app/.env");
            // Docker splits options on commas, never on colons: `ro:z` is
            // an unknown option, and the container refuses to start.
            expect(options).toBe(selinux ? "ro,z" : "ro");
        });

        test(`keeps every option in its own field ${label}`, async () => {
            const specs = await runMountSpecs({ selinux });

            for (const spec of Object.values(specs)) {
                const { destination, options } = parseMountSpec({ spec });

                expect(destination).not.toContain(",");
                expect(destination).not.toContain(":");
                expect(destination.startsWith("/")).toBe(true);

                // Only the options docker understands, comma separated.
                for (const option of options.split(",")) {
                    expect(["", "ro", "rw", "z", "Z"]).toContain(option);
                }
            }
        });
    }
});

describe("install.sh data rescue", () => {
    test("rescues the container's data before replacing it", async () => {
        const source = await Bun.file(INSTALL_SCRIPT).text();
        const rescue = source.indexOf("\n    rescue_container_data\n");
        const replace = source.indexOf(
            `say "Replacing the Cobble container"`,
        );

        // A container whose /data was never mounted keeps its database in
        // its own layer, so the copy has to happen before the container is
        // removed.
        expect(rescue).toBeGreaterThan(-1);
        expect(replace).toBeGreaterThan(rescue);
    });

    test("the database backup uses the same mount options", async () => {
        const source = await Bun.file(INSTALL_SCRIPT).text();

        expect(source).toContain(`backup_mount="$data_source:/data`);
        expect(source).toContain("${MOUNT_OPTS:+:$MOUNT_OPTS}");
    });

    test("no code line glues an option onto a destination", async () => {
        const source = await Bun.file(INSTALL_SCRIPT).text();

        // Comments may quote the old broken form; only real code counts.
        const code = source
            .split("\n")
            .filter((line) => !line.trimStart().startsWith("#"))
            .join("\n");

        expect(code).not.toContain("/data,z");
        expect(code).not.toContain("/app/.env:ro,z");
        expect(code).not.toContain("/backups-archives,z");
    });
});
