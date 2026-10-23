import Span from "@moduletrace/twui/layout/Span";
import type { RunningVersion } from "@/src/utils/running-version";
import versionLabel from "../(utils)/version-label";

type Props = {
    running?: RunningVersion | null;
};

/**
 * The release this server runs, in words: settings are where someone
 * checks whether an update landed. The stage and, on a development server,
 * that it is one ride along, so neither what it runs nor what it is can be
 * mistaken.
 */
export default function VersionLine({ running }: Props) {
    const label = versionLabel({ running });

    if (!label) return null;

    return <Span className="text-sm leading-5 text-ink">{label}</Span>;
}
