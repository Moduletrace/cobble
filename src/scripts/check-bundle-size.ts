import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import path from "path";
import { gzipSync } from "node:zlib";

/**
 * Fails when the conversation page's initial JavaScript (or CSS) grows past
 * its budget, or when the full Lucide icon set comes back. Run after
 * `NODE_ENV=production bunx bunext build`.
 *
 * The editor is part of the page by design, so the budget allows Tiptap;
 * the Lucide guard is what keeps the old icon bundle from returning.
 */
const MaxInitialJsBytes = 450 * 1024;
const MaxSingleFileBytes = 300 * 1024;
const MaxCssBytes = 40 * 1024;

const pages_dir = path.resolve(".bunext/public/pages");
const conversation_dir = path.join(pages_dir, "admin/bots/[bot_id]");

if (!existsSync(conversation_dir)) {
    console.error(
        `No conversation build at ${path.relative(process.cwd(), conversation_dir)}. Run \`NODE_ENV=production bunx bunext build\` first.`,
    );
    process.exit(1);
}

const entry = readdirSync(conversation_dir)
    .filter((name) => name.endsWith(".js"))
    .map((name) => path.join(conversation_dir, name))
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)[0];

if (!entry) {
    console.error(`No page script in ${conversation_dir}.`);
    process.exit(1);
}

const sizes = new Map<string, number>();
const gzipSize = (file: string) => {
    const cached = sizes.get(file);

    if (cached !== undefined) return cached;

    const size = gzipSync(readFileSync(file)).byteLength;

    sizes.set(file, size);

    return size;
};

const static_files = new Set<string>();
const queue = [entry];

while (queue.length) {
    const file = queue.pop()!;

    if (static_files.has(file)) continue;

    static_files.add(file);

    const source = readFileSync(file, "utf8");

    for (const match of source.matchAll(/(?:from|import)\s*["']([^"']+)["']/g)) {
        const target = resolve({ file, specifier: match[1]! });

        if (target) queue.push(target);
    }

}

const initial_bytes = sumBytes([...static_files]);
const largest = [...static_files].sort((a, b) => gzipSize(b) - gzipSize(a))[0];
const largest_bytes = largest ? gzipSize(largest) : 0;
const css_bytes = readdirSync(conversation_dir)
    .filter((name) => name.endsWith(".css"))
    .reduce((total, name) => total + gzipSize(path.join(conversation_dir, name)), 0);
/**
 * Every icon imported is listed in the module comments. A handful is
 * normal; the whole catalog (about 1,900) is the regression this catches.
 */
const lucide_icons = new Set<string>();

for (const file of static_files) {
    for (const match of readFileSync(file, "utf8").matchAll(
        /lucide-react\/dist\/esm\/icons\/([a-z0-9-]+)\.mjs/g,
    )) {
        lucide_icons.add(match[1]!);
    }
}

report({ label: "initial JS", bytes: initial_bytes, budget: MaxInitialJsBytes });
report({ label: "largest file", bytes: largest_bytes, budget: MaxSingleFileBytes });
report({ label: "CSS", bytes: css_bytes, budget: MaxCssBytes });

let failed = false;

failed = check({
    label: "initial JS",
    bytes: initial_bytes,
    budget: MaxInitialJsBytes,
}) || failed;
failed = check({
    label: "largest file",
    bytes: largest_bytes,
    budget: MaxSingleFileBytes,
}) || failed;
failed = check({ label: "CSS", bytes: css_bytes, budget: MaxCssBytes }) || failed;

if (lucide_icons.size > 200) {
    console.error(`The full Lucide icon set is in the page bundle (${lucide_icons.size} icons).`);
    failed = true;
}

if (failed) process.exit(1);

console.log("Bundle budget holds.");

function resolve({ file, specifier }: { file: string; specifier: string }) {
    if (!specifier.startsWith(".")) return null;

    const target = path.resolve(path.dirname(file), specifier);

    return existsSync(target) ? target : null;
}

function sumBytes(files: string[]) {
    return files.reduce((total, file) => total + gzipSize(file), 0);
}

function report({ label, bytes, budget }: { label: string; bytes: number; budget: number }) {
    console.log(`${label}: ${kb(bytes)} (budget ${kb(budget)})`);
}

function check({ label, bytes, budget }: { label: string; bytes: number; budget: number }) {
    if (bytes <= budget) return false;

    console.error(`${label} is over budget: ${kb(bytes)} > ${kb(budget)}.`);
    return true;
}

function kb(bytes: number) {
    return `${Math.round(bytes / 1024)} KB`;
}
