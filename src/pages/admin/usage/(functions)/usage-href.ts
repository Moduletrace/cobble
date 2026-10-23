import { UsagePath } from "@/src/dict/rail-pages-dict";

type Params = {
    days?: number;
};

/**
 * The usage page's address for the period it is showing, so a range can be
 * linked to and the browser's own back button walks back through them.
 */
export default function usageHref({ days }: Params): string {
    if (!days) return UsagePath;

    return `${UsagePath}?range=${days}`;
}
