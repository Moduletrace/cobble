import { readdirSync, rmSync, statSync } from "node:fs";
import path from "node:path";
import log from "./log";

/**
 * Folders inside a browser profile that only ever hold what Chrome can
 * download or build again. Cookies, logins, site permissions, history,
 * local storage and extensions live elsewhere and are never touched: the
 * profile is mounted so a computer keeps them across restarts.
 */
const RegenerableProfileDirs = [
    "ShaderCache",
    "GrShaderCache",
    "GPUCache",
    "GPUPersistentCache",
    "GraphiteDawnCache",
    "DawnGraphiteCache",
    "DawnWebGPUCache",
    "component_crx_cache",
    "CertificateRevocation",
    "optimization_guide_model_store",
];

/**
 * The same, in each profile's own folder (`Default`, `Profile 1`, ...).
 * Never `Local Storage`, `IndexedDB` or `Storage/ext`: those are what the
 * extensions a computer keeps (Cookie-Editor among them) hold their own
 * state in, which is not rebuilt by downloading anything.
 */
const RegenerableBrowserDirs = [
    "Cache",
    "Code Cache",
    "GPUCache",
    "GPUPersistentCache",
    "GraphiteDawnCache",
    "DawnGraphiteCache",
    "DawnWebGPUCache",
    "Service Worker/CacheStorage",
    "Service Worker/ScriptCache",
];

/**
 * Frees what Chrome downloaded or built last time it ran and will build
 * again: extension assets, the component updater's CRX cache, model files,
 * certificate revocation lists, HTTP and code caches. A profile otherwise
 * grows by hundreds of megabytes and never shrinks.
 *
 * Only called while no browser runs (a cache cleared under a live Chrome
 * leaves it writing into a deleted folder). Returns the bytes freed.
 */
export default function pruneProfileCache({ profile_dir }: { profile_dir: string }) {
    let freed = 0;

    for (const name of RegenerableProfileDirs) {
        freed += freeDir({ target: path.join(profile_dir, name) });
    }

    for (const profile of safeReadDir({ target: profile_dir })) {
        /**
         * A profile's own folder: `Default` or `Profile <n>`, and
         * `System Profile` for Chrome's own pages.
         */
        if (!/^(Default|Profile \d+|System Profile)$/.test(profile)) continue;

        for (const name of RegenerableBrowserDirs) {
            freed += freeDir({ target: path.join(profile_dir, profile, name) });
        }
    }

    if (freed > 0) log({ name: "browser", message: `cleared ${(freed / (1024 * 1024)).toFixed(1)} MB of regenerable profile cache` });

    return freed;
}

/**
 * Removes one folder with what is under it, returning the bytes.
 */
function freeDir({ target }: { target: string }) {
    const size = dirSize({ target });

    if (!size) return 0;

    try {
        rmSync(target, { recursive: true, force: true });

        return size;
    } catch {
        /**
         * Something that can't be removed is left for the next start; the
         * browser comes up either way.
         */
        return 0;
    }
}

/**
 * Bytes under one folder. Links are counted, never followed: a profile
 * has none of its own, but a retired one might.
 */
function dirSize({ target }: { target: string }): number {
    let stat;

    try {
        stat = statSync(target);
    } catch {
        return 0;
    }

    if (stat.isFile()) return stat.size;
    if (!stat.isDirectory()) return 0;

    return safeReadDir({ target }).reduce((total, entry) => total + dirSize({ target: path.join(target, entry) }), 0);
}

function safeReadDir({ target }: { target: string }) {
    try {
        return readdirSync(target);
    } catch {
        return [];
    }
}
