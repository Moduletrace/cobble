/**
 * Where a worker's install request stands: waiting on the coordinator,
 * installed, refused by it, or failed (its run ended without an answer,
 * failed or was stopped).
 */
export const InstallRequestStatuses = ["pending", "installed", "refused", "failed"] as const;

export type InstallRequestStatus = (typeof InstallRequestStatuses)[number];

/**
 * What a worker may ask the coordinator to install with: Debian's own
 * packages, PyPI's or npm's.
 */
export const InstallPackageManagers = ["apt", "pip", "npm"] as const;

export type InstallPackageManager = (typeof InstallPackageManagers)[number];

/**
 * A package name as a request may give it: letters, digits and `+._-`
 * (npm's `@scope/name` too), never a version range, URL, path or flag.
 */
export const InstallPackageNamePattern = /^(@[A-Za-z0-9][A-Za-z0-9._-]*\/)?[A-Za-z0-9][A-Za-z0-9+._-]*$/;
