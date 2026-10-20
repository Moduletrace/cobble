import path from "path";
import grabDirNames from "@/src/utils/grab-dir-names";
import type { PrecacheManifest } from "@/src/types";
import buildPrecacheManifest from "./build-precache-manifest";

let manifest: PrecacheManifest | null | undefined;

/**
 * The running build's precache manifest, production only (development
 * rebuilds on every change and is never cached). Read once per process:
 * a build never changes under a running server.
 */
export default function grabPrecacheManifest(): PrecacheManifest | null {
    if (process.env.NODE_ENV != "production") return null;
    if (manifest !== undefined) return manifest;

    try {
        manifest = buildPrecacheManifest({
            bunext_dir: path.join(grabDirNames().ROOT_DIR, ".bunext"),
        });
    } catch (error) {
        console.log("Couldn't read the build for precaching:", error);
        manifest = null;
    }

    return manifest;
}
