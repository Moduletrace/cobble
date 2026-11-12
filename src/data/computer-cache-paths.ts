/**
 * What a bot's folder on a computer holds that is rebuilt on demand, and
 * so is never worth keeping.
 *
 * A computer's workspace is mounted from the data volume, so without this
 * every cache a run writes beside its work is kept forever: one install's
 * volume held 368 MB of npm cache, 188 MB of pip and headless-Chromium
 * caches and 53 MB of bun's install cache, against 178 MB of bot files.
 * Runs now point their caches at the account's own home inside the
 * container (`computerCacheEnv`), which a new container starts without;
 * `pruneComputerCaches` clears what earlier runs left behind.
 */

/**
 * A run folder's caches, relative to it. `.cache` is where every tool
 * writes once a run has one (`computerCacheEnv`: pip, Playwright,
 * Chromium, bun's install cache); the rest is what runs before that wrote
 * into the folder itself.
 */
export const ComputerRunCacheEntries = [
    ".cache",
    ".npm/_logs",
    ".npm/_cacache",
    ".bun/install/cache",
] as const;

/**
 * Python's bytecode folders, anywhere below a run folder: every script a
 * bot imports makes one.
 */
export const ComputerBytecodeCacheDir = "__pycache__";

/**
 * A browser profile a bot started itself, in its own folder, rather than
 * the app's (which lives at `AppData.ComputerBrowserProfileDir`). It holds
 * cookies like any profile, so only its caches go, never the folder.
 */
export const ComputerRunBrowserProfileDir = ".cobble-browser";

/**
 * The folders inside a Chrome profile that only hold what Chrome downloads
 * or builds again. Two of them alone were 729 MB of one install's 1009 MB
 * profile, while what a profile is kept for (cookies, logins, site
 * permissions, history, local storage, extensions) is a few MB.
 *
 * Keep alike `computer/agent/prune-profile-cache.ts`, which clears the
 * same ones from inside the container on each start; this list is for the
 * app's own daily prune and for a data archive, which both work on the
 * data volume.
 */
export const BrowserProfileCacheDirs = [
    "Cache",
    "Code Cache",
    "GPUCache",
    "GPUPersistentCache",
    "DawnGraphiteCache",
    "DawnWebGPUCache",
    "GraphiteDawnCache",
    "GrShaderCache",
    "ShaderCache",
    "Service Worker",
    "CertificateRevocation",
    "component_crx_cache",
    "WasmTtsEngine",
    "OnDeviceHeadSuggestModel",
    "ActorSafetyLists",
    "OptimizationHints",
    "OptimizationGuideModelsManifest",
    "optimization_guide_model_store",
    "PKIMetadata",
    "hyphen-data",
    "ZxcvbnData",
    "Subresource Filter",
    "segmentation_platform",
    "Crowd Deny",
    "SafetyTips",
    "BrowserMetrics-spare.pma",
] as const;