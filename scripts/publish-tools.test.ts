import { describe, expect, test } from "bun:test";
import path from "path";

const ROOT = path.join(import.meta.dir, "..");
const COMMON = path.join(ROOT, "scripts/lib/publish-common.sh");
const RELEASE = path.join(ROOT, "scripts/lib/publish-release.sh");
const MIRROR = path.join(ROOT, "scripts/mirror-gitea.sh");
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
    for (const script of [...SCRIPTS, MIRROR, COMMON, RELEASE]) {
        test(`${path.relative(ROOT, script)} parses`, async () => {
            const proc = Bun.spawn({ cmd: ["bash", "-n", script] });
            expect(await proc.exited).toBe(0);
        });
    }

    test("the mirror script sources the shared libraries", async () => {
        const source = await Bun.file(MIRROR).text();

        expect(source).toContain('SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"');
        expect(source).toContain('. "$SCRIPT_DIR/lib/publish-common.sh"');
        expect(source).toContain('. "$SCRIPT_DIR/lib/publish-release.sh"');
    });

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

describe("mirror script wiring", () => {
    test("CI never pushes to the Gitea registry", async () => {
        const workflow = await Bun.file(
            path.join(ROOT, ".github/workflows/release.yml"),
        ).text();

        expect(workflow).not.toContain("git.tben.me");
        expect(workflow).not.toContain("GITEA_TOKEN");
        expect(workflow).not.toContain("imagetools create");
        expect(workflow).toContain("Build and push to GHCR");
    });

    test("the mirror script copies every tag the workflow publishes", async () => {
        const [workflow, mirror] = await Promise.all([
            Bun.file(path.join(ROOT, ".github/workflows/release.yml")).text(),
            Bun.file(MIRROR).text(),
        ]);

        // The workflow's own four tags, so a mirror tag can never be invented
        // here and go missing there.
        for (const tag of ["latest", "${version}", "${minor}", "${sha}"]) {
            expect(workflow).toContain(tag);
        }
        expect(mirror).toContain("mirror_minor_tag");
        expect(mirror).toContain("mirror_sha_tag");
        expect(mirror).toContain("mirror_fixed_tags");
        expect(mirror).toContain("mirror_moving_tags");
    });

    test("the mirror script asks before copying and verifies each digest", async () => {
        const source = await Bun.file(MIRROR).text();

        expect(source).toContain("confirm \"Mirror $TAG into");
        expect(source).toContain("mirror_digest_on_host");
        expect(source).toContain("skopeo");
        expect(source).toContain("--all");
    });

    test("the pull command it prints names the public host, not the docker one", async () => {
        const source = await Bun.file(MIRROR).text();

        // The copy reaches the registry by docker network name, which is not
        // resolvable for an install; printing that would hand out a broken
        // command.
        expect(source).toContain("MIRROR_REGISTRY_PUBLIC_HOST");
        expect(source).toContain('"$REGISTRY_PUBLIC_HOST" "$REGISTRY_REPO" "$TAG"');
        expect(source).not.toContain('"${REGISTRY_HOST%%:*}" "$REGISTRY_REPO" "$TAG"');
    });

    test("without a token the mirror script refuses instead of guessing", async () => {
        const proc = Bun.spawn({
            cmd: ["bash", MIRROR, "--yes"],
            cwd: ROOT,
            env: { ...process.env, GITEA_TOKEN: "" },
            stdout: "pipe",
            stderr: "pipe",
        });
        const [stderr, code] = await Promise.all([
            new Response(proc.stderr).text(),
            proc.exited,
        ]);

        expect(code).toBe(1);
        expect(stderr).toContain("No Gitea token");
    });
});

describe("mirror lib tag handling", () => {
    test("major.minor is read exactly as the release workflow reads it", async () => {
        const block = await blockCaller({ file: MIRROR, name: "mirror-tags" });

        for (const [version, expected] of [
            ["v0.1.5", "0.1"],
            ["v1.2.3", "1.2"],
            ["v10.20.30", "10.20"],
            ["v0.1.5-rc.1", "0.1"],
        ] as const) {
            const out = await runBash({
                script: [block, `mirror_minor_tag '${version}'`].join("\n"),
            });
            expect(out).toBe(expected);
        }
    });

    test("fixed tags are the version and its commit, moving ones the rest", async () => {
        const block = await blockCaller({ file: MIRROR, name: "mirror-tags" });

        const fixed = await runBash({
            script: [block, "mirror_fixed_tags v0.1.5"].join("\n"),
        });
        expect(fixed.split("\n")[0]).toBe("v0.1.5");

        const moving = await runBash({
            script: [block, "mirror_moving_tags v0.1.5"].join("\n"),
        });
        expect(moving.split("\n")).toEqual(["latest", "0.1"]);
    });

    test("a tag with no commit on disk still mirrors its version", async () => {
        const block = await blockCaller({ file: MIRROR, name: "mirror-tags" });

        const out = await runBash({
            script: [block, "mirror_fixed_tags v99.99.99"].join("\n"),
        });

        expect(out).toBe("v99.99.99");
    });
});

describe("mirror lib moving tag guard", () => {
    test("a release may move latest while it owns it", async () => {
        const block = await blockCaller({ file: MIRROR, name: "mirror-guard" });

        const out = await runBash({
            script: [
                block,
                'mirror_owns_moving_tags sha256:aa sha256:aa && printf owns',
            ].join("\n"),
        });

        expect(out).toBe("owns");
    });

    test("a newer release's latest is never rolled back", async () => {
        const block = await blockCaller({ file: MIRROR, name: "mirror-guard" });

        const out = await runBash({
            script: [
                block,
                'if mirror_owns_moving_tags sha256:aa sha256:bb; then printf owns; else printf refuses; fi',
            ].join("\n"),
        });

        expect(out).toBe("refuses");
    });

    test("with no latest to compare, the release is taken as newest", async () => {
        const block = await blockCaller({ file: MIRROR, name: "mirror-guard" });

        const out = await runBash({
            script: [
                block,
                'mirror_owns_moving_tags sha256:aa "" && printf owns',
            ].join("\n"),
        });

        expect(out).toBe("owns");
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

describe("publish lib compare link", () => {
    // The range is what makes the link open this release's diff; a bare
    // /compare/ opened the host's default comparison instead.
    test("adds the tag range to the compare path", async () => {
        const block = await blockCaller({ file: RELEASE, name: "notes-file" });

        const out = await runBash({
            script: [
                block,
                `TAG=v0.1.4`,
                `build_compare_url https://example.test/compare/ v0.1.3`,
            ].join("\n"),
        });

        expect(out).toBe("https://example.test/compare/v0.1.3...v0.1.4");
    });

    test("leaves the path alone when there is no earlier tag", async () => {
        const block = await blockCaller({ file: RELEASE, name: "notes-file" });

        const out = await runBash({
            script: [
                block,
                `TAG=v0.1.0`,
                `build_compare_url https://example.test/compare/ ""`,
            ].join("\n"),
        });

        expect(out).toBe("https://example.test/compare/");
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
