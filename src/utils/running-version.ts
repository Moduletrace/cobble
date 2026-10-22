import package_json from "@/package.json";

/**
 * What the General settings page shows as the running Cobble.
 */
export type RunningVersion = {
    /**
     * The release's version: the image tag the installer pulled
     * (`COBBLE_VERSION`, set when the image was built), else
     * `package.json`'s version, which a development server reports too.
     */
    version: string | null;
    /**
     * Where the live server runs (`NODE_ENV`): `production`,
     * `development` or the environment's own name when it set another.
     */
    mode: string;
};

type Params = {
    /**
     * The process environment (`process.env`).
     */
    env: Record<string, string | undefined>;
    /**
     * `package.json`'s version, for a build that wasn't given one.
     */
    package_version?: string;
};

const VersionPattern = /^[A-Za-z0-9._-]{1,64}$/;

/**
 * The version a running Cobble reports, development included: the image's
 * build argument when it has one (the release tag), else the source's own
 * version, so a dev server names the code it is working on.
 */
export default function runningVersion({
    env,
    package_version = package_json.version,
}: Params): RunningVersion {
    const build_version = env.COBBLE_VERSION?.trim();

    const version =
        build_version && VersionPattern.test(build_version)
            ? build_version
            : package_version && VersionPattern.test(package_version)
              ? package_version
              : null;

    return { version, mode: env.NODE_ENV || "development" };
}
