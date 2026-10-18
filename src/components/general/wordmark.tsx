import { twMerge } from "tailwind-merge";
import { SiteData } from "@/src/data/site-data";
import { WordmarkPaths, WordmarkViewBox } from "@/src/data/wordmark-paths";

type Props = {
    /**
     * Rendered height in px. The plain wordmark is for 16 to 48 px.
     */
    height?: number;
    className?: string;
};

const [, , VIEWBOX_WIDTH, VIEWBOX_HEIGHT] = WordmarkViewBox.split(" ").map(
    Number,
) as [number, number, number, number];

/**
 * # Wordmark
 * @description The `cobble` wordmark as vector paths, never live text. Takes
 * the current text colour.
 */
export default function Wordmark({ height = 15, className }: Props) {
    const width = (height * VIEWBOX_WIDTH) / VIEWBOX_HEIGHT;

    return (
        <svg
            width={width}
            height={height}
            viewBox={WordmarkViewBox}
            role="img"
            aria-label={SiteData["SiteName"]}
            className={twMerge("shrink-0 fill-current text-ink", className)}
        >
            {WordmarkPaths.map((d) => (
                <WordmarkPath key={d.slice(0, 32)} d={d} />
            ))}
        </svg>
    );
}

function WordmarkPath({ d }: { d: string }) {
    return <path d={d} />;
}
