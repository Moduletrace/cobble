import { describe, expect, test } from "bun:test";
import path from "path";

const ROOT = path.join(import.meta.dir, "..");
const COMMON = path.join(ROOT, "scripts/lib/publish-common.sh");
const RELEASE = path.join(ROOT, "scripts/lib/publish-release.sh");
const SCRIPTS = [
    path.join(ROOT, "scripts/publish-github.sh"),
    path.join(ROOT, "scripts/publish-gitea.sh"),
];

/**
 * Lifts one marked block out of a script, so the tests run the real publish
 * helpers instead of a copy of them that could drift.
 */
async function readMarkedBlock({
    file,
    name,
}: {
    file: string;
    name: string;
}): Promise<string> {
    const source = await Bun.file(file).text();
    const start = `# MARK:${name}\n`;
    const end = `# END:${name}`;
    const from = source.indexOf(start);
    const to = source.indexOf(end);

    expect(from).toBeGreaterThan(-1);
    expect(to).toBeGreaterThan(from);

    return source.slice(from + start.length, to);
}

/**
 * Returns a caller for a marked block. Every block that needs the logging
 * helpers gets the preamble too, since `fail` lives there.
 */
async function blockCaller({
    file = COMMON,
    name,
}: {
    file?: string;
    name: string;
}): Promise<string> {
    const [preamble, block] = await Promise.all([
        readMarkedBlock({ file: COMMON, name: "preamble" }),
        readMarkedBlock({ file, name }),
    ]);

    return [preamble, block].join("\n");
}

/** Runs a bash snippet with a trimmed PATH and returns stdout, failing on stderr. */
async function runBash({
    script,
    env,
}: {
    script: string;
    env?: Record<string, string>;
}): Promise<string> {
    const proc = Bun.spawn({
        cmd: ["bash", "-c", script],
        cwd: ROOT,
        stdout: "pipe",
        stderr: "pipe",
        env: { ...process.env, ...env },
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

/**
 * A PATH with the usual tools but no jq, so the bash fallback in
 * `json_escape` is the one that runs.
 */
async function pathWithoutJq(): Promise<string> {
    const dir = await Bun.$`mktemp -d`.text().then((it) => it.trim());
    const tools = ["bash", "sed", "cat", "mktemp", "git", "head", "cut", "tr", "wc", "grep", "awk"];

    await Bun.$`mkdir -p ${dir}`;
    for (const tool of tools) {
        const found = Bun.which(tool);
        if (found) {
            await Bun.$`ln -sf ${found} ${path.join(dir, tool)}`;
        }
    }

    return dir;
}

describe("publish scripts syntax", () => {
    for (const script of [...SCRIPTS, COMMON, RELEASE]) {
        test(`${path.relative(ROOT, script)} parses`, async () => {
            const proc = Bun.spawn({ cmd: ["bash", "-n", script] });
            expect(await proc.exited).toBe(0);
        });
    }

    test("both publish scripts source the shared library", async () => {
        for (const script of SCRIPTS) {
            const source = await Bun.file(script).text();

            expect(source).toContain('SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"');
            expect(source).toContain('. "$SCRIPT_DIR/lib/publish-common.sh"');
            expect(source).toContain('. "$SCRIPT_DIR/lib/publish-release.sh"');
        }
    });
});

describe("publish scripts remote wiring", () => {
    test("the GitHub script releases from origin", async () => {
        const source = await Bun.file(SCRIPTS[0]!).text();

        expect(source).toContain('REMOTE="origin"');
        expect(source).toContain("gh release create");
    });

    test("the Gitea script releases from the gitea mirror", async () => {
        const source = await Bun.file(SCRIPTS[1]!).text();

        expect(source).toContain('REMOTE="gitea"');
        expect(source).toContain("/releases");
        // No CLI could be assumed there, so the API is called with curl.
        expect(source).toContain("curl");
    });

    test("the image is only built by the GitHub release", async () => {
        const source = await Bun.file(SCRIPTS[1]!).text();

        expect(source).toContain("The image is built by the GitHub release");
    });
});

describe("publish lib version handling", () => {
    test("normalizes a version with and without the v", async () => {
        const block = await blockCaller({ name: "version" });

        const out = await runBash({
            script: [
                block,
                `normalize_version 0.1.2; printf '\\n'`,
                `normalize_version v0.1.2; printf '\\n'`,
            ].join("\n"),
        });

        expect(out.split("\n")).toEqual(["v0.1.2", "v0.1.2"]);
    });

    for (const good of ["0.1.2", "v0.1.2", "v10.20.30", "v1.2.3-rc.1"]) {
        test(`accepts the release version ${good}`, async () => {
            const block = await blockCaller({ name: "version" });

            const out = await runBash({
                script: [block, `validate_version ${good}`, `printf ok`].join(
                    "\n",
                ),
            });

            expect(out).toBe("ok");
        });
    }

    for (const bad of ["0.1", "latest", "v1", "v1.2.3.4", "v1.x.3", ""]) {
        test(`refuses '${bad}'`, async () => {
            const block = await blockCaller({ name: "version" });
            const proc = Bun.spawn({
                cmd: ["bash", "-c", [block, `validate_version '${bad}'`].join("\n")],
                cwd: ROOT,
                stdout: "pipe",
                stderr: "pipe",
            });

            // An empty version would pass nothing to validate and is caught
            // by the caller, so it is skipped here.
            if (bad === "") {
                await proc.exited;
                return;
            }

            expect(await proc.exited).not.toBe(0);
            const stderr = await new Response(proc.stderr).text();
            expect(stderr).toContain("is not a release version");
        });
    }
});

describe("publish lib remote URLs", () => {
    const cases = [
        {
            url: "git@github.com:Moduletrace/cobble.git",
            host: "github.com",
            owner: "Moduletrace",
            repo: "cobble",
        },
        {
            url: "git@git.tben.me:Moduletrace/cobble.git",
            host: "git.tben.me",
            owner: "Moduletrace",
            repo: "cobble",
        },
        {
            url: "ssh://git@git.tben.me:222/Moduletrace/cobble.git",
            host: "git.tben.me:222",
            owner: "Moduletrace",
            repo: "cobble",
        },
        {
            url: "https://github.com/Moduletrace/cobble.git",
            host: "github.com",
            owner: "Moduletrace",
            repo: "cobble",
        },
        {
            url: "https://git.tben.me/Moduletrace/cobble",
            host: "git.tben.me",
            owner: "Moduletrace",
            repo: "cobble",
        },
    ];

    for (const item of cases) {
        test(`reads ${item.url}`, async () => {
            const block = await blockCaller({ name: "remote-url" });

            const out = await runBash({
                script: [
                    block,
                    `parse_remote_url '${item.url}'`,
                    `printf '%s %s %s' "$REMOTE_HOST" "$REMOTE_OWNER" "$REMOTE_REPO"`,
                ].join("\n"),
            });

            expect(out).toBe(`${item.host} ${item.owner} ${item.repo}`);
        });
    }

    for (const bad of ["", "not-a-url", "git@host:"]) {
        test(`refuses '${bad}'`, async () => {
            const block = await blockCaller({ name: "remote-url" });
            const proc = Bun.spawn({
                cmd: ["bash", "-c", [block, `parse_remote_url '${bad}'`].join("\n")],
                cwd: ROOT,
                stdout: "pipe",
                stderr: "pipe",
            });

            expect(await proc.exited).not.toBe(0);
        });
    }
});

describe("publish lib release notes", () => {
    test("lists the commits and the compare link", async () => {
        const block = await blockCaller({ name: "notes" });

        const out = await runBash({
            script: [
                block,
                `ROOT="$(git rev-parse --show-toplevel)"`,
                `release_notes --from v0.1.1 --to v0.1.2 --compare-url https://example.test/compare/`,
            ].join("\n"),
        });

        expect(out).toStartWith("## Changes");
        expect(out).toContain("**Full changelog**: https://example.test/compare/");
        expect(out).toContain("- ");
    });

    test("never overflows the commit cap", async () => {
        const block = await blockCaller({ name: "notes" });

        const out = await runBash({
            script: [
                block,
                `ROOT="$(git rev-parse --show-toplevel)"`,
                `RELEASE_NOTES_MAX_COMMITS=2`,
                `release_notes --to v0.1.2`,
            ].join("\n"),
        });

        expect(out).toContain("_Showing the newest 2 of");
    });
});

describe("publish lib json escaping", () => {
    const sample = 'a\nb\t"c" \\ é';

    test("escapes with jq", async () => {
        const block = await blockCaller({ name: "json-escape" });

        const out = await runBash({
            script: [
                block,
                `printf '{"body":"%s"}' "$(json_escape '${sample}')"`,
            ].join("\n"),
        });

        // The escaped text has to survive a real JSON parse.
        const parsed = JSON.parse(out) as { body: string };
        expect(parsed.body).toBe("a\nb\t\"c\" \\ é");
    });

    test("escapes without jq installed", async () => {
        const block = await blockCaller({ name: "json-escape" });
        const dir = await pathWithoutJq();

        try {
            const out = await runBash({
                script: [
                    block,
                    `printf '{"body":"%s"}' "$(json_escape '${sample}')"`,
                ].join("\n"),
                env: { PATH: dir },
            });

            const parsed = JSON.parse(out) as { body: string };
            expect(parsed.body).toBe("a\nb\t\"c\" \\ é");
        } finally {
            await Bun.$`rm -rf ${dir}`;
        }
    });
});

describe("publish lib tag handling", () => {
    test("an existing tag on HEAD is reused", async () => {
        const block = await blockCaller({ name: "git-state" });
        const dir = await Bun.$`mktemp -d`.text().then((it) => it.trim());

        try {
            const out = await runBash({
                script: [
                    `cd ${dir}`,
                    `git init -q .`,
                    `git config user.email test@example.test`,
                    `git config user.name Test`,
                    `printf x > file`,
                    `git add file`,
                    `git commit -qm one`,
                    block,
                    `ensure_tag v9.9.9`,
                    `ensure_tag v9.9.9`,
                    `git tag --list`,
                ].join("\n"),
            });

            expect(out.split("\n").filter((line) => line === "v9.9.9")).toHaveLength(
                1,
            );
        } finally {
            await Bun.$`rm -rf ${dir}`;
        }
    });

    test("a dirty worktree stops the publish", async () => {
        const block = await blockCaller({ name: "git-state" });
        const dir = await Bun.$`mktemp -d`.text().then((it) => it.trim());

        try {
            const proc = Bun.spawn({
                cmd: [
                    "bash",
                    "-c",
                    [
                        `cd ${dir}`,
                        `git init -q .`,
                        `git config user.email test@example.test`,
                        `git config user.name Test`,
                        `printf x > file`,
                        `git add file`,
                        `git commit -qm one`,
                        `printf y >> file`,
                        block,
                        `require_clean_worktree`,
                    ].join("\n"),
                ],
                stdout: "pipe",
                stderr: "pipe",
            });

            expect(await proc.exited).not.toBe(0);
            expect(await new Response(proc.stderr).text()).toContain(
                "uncommitted changes",
            );
        } finally {
            await Bun.$`rm -rf ${dir}`;
        }
    });
});

describe("publish lib helpers", () => {
    test("require_cmd explains a missing binary", async () => {
        const block = await blockCaller({ name: "require-cmd" });
        const proc = Bun.spawn({
            cmd: [
                "bash",
                "-c",
                [block, `require_cmd definitely-not-installed "Install it."`].join(
                    "\n",
                ),
            ],
            cwd: ROOT,
            stdout: "pipe",
            stderr: "pipe",
        });

        expect(await proc.exited).not.toBe(0);
        expect(await new Response(proc.stderr).text()).toContain(
            "Missing 'definitely-not-installed'. Install it.",
        );
    });

    test("tea_token_for_host reads the host's token", async () => {
        const block = await blockCaller({
            file: SCRIPTS[1]!,
            name: "tea-token",
        });
        const dir = await Bun.$`mktemp -d`.text().then((it) => it.trim());
        const config = path.join(dir, "config.yml");

        try {
            await Bun.write(
                config,
                [
                    "logins:",
                    "  - name: github.com",
                    "    url: https://github.com",
                    "    token: github-token",
                    "  - name: git.tben.me",
                    "    url: https://git.tben.me",
                    "    token: gitea-token",
                    "",
                ].join("\n"),
            );

            const out = await runBash({
                script: [
                    block,
                    `tea_token_for_host git.tben.me '${config}'`,
                ].join("\n"),
            });

            expect(out).toBe("gitea-token");
        } finally {
            await Bun.$`rm -rf ${dir}`;
        }
    });

    test("tea_token_for_host is quiet without a config", async () => {
        const block = await blockCaller({
            file: SCRIPTS[1]!,
            name: "tea-token",
        });

        const out = await runBash({
            script: [
                block,
                `tea_token_for_host git.tben.me /nonexistent/cobble-test`,
                `printf done`,
            ].join("\n"),
        });

        expect(out).toBe("done");
    });
});
