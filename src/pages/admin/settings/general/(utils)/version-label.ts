import type { RunningVersion } from "@/src/utils/running-version";

/**
 * The stage every release is published as. Cobble is still alpha: the
 * schema, the settings and the screens change between releases, so the app
 * says so wherever it names its version, not only in the README.
 */
export const ReleaseStage = "alpha";

type Params = {
    running?: RunningVersion | null;
};

/**
 * The running release in words, for the General settings page: "Cobble
 * v0.1.5 (alpha)", and a development server adds that it is one, so a dev
 * build is never mistaken for a release.
 */
export default function versionLabel({ running }: Params): string | null {
    if (!running) return null;

    const parts = [running.mode == "development" ? "development" : "", ReleaseStage].filter(
        (part) => part.length > 0,
    );

    return `${running.version ? `Cobble ${running.version}` : "Cobble"} (${parts.join(", ")})`;
}
