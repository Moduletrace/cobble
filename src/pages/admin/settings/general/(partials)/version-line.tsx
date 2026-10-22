import Span from "@moduletrace/twui/layout/Span";
import type { RunningVersion } from "@/src/utils/running-version";

type Props = {
    running?: RunningVersion | null;
};

/**
 * The release this server runs, in words: settings are where someone
 * checks whether an update landed. A development server says so beside
 * its version, so the two are never mistaken.
 */
export default function VersionLine({ running }: Props) {
    if (!running) return null;

    const version = running.version
        ? `Cobble ${running.version}`
        : "Cobble";

    return (
        <Span className="text-sm leading-5 text-ink">
            {running.mode == "development"
                ? `${version} (development)`
                : version}
        </Span>
    );
}
