import { GraphicsPrefix } from "@/src/dict/graphics-dict";

type Params = {
    graphic_id: number;
    dark?: boolean;
    /**
     * The version shown, so a changed graphic loads afresh.
     */
    version?: number;
};

/**
 * Where a graphic's sandboxed document is served, in a theme.
 */
export default function graphicUrl({ graphic_id, dark, version }: Params) {
    const query = new URLSearchParams({ theme: dark ? "dark" : "light" });

    if (version) query.set("v", String(version));

    return `${GraphicsPrefix}/${graphic_id}?${query.toString()}`;
}

/**
 * The app page that shows a graphic full size, beside the rail.
 */
export function graphicPageHref({ graphic_id, bot_id }: { graphic_id: number; bot_id: number }) {
    return `/admin/bots/${bot_id}/graphics/${graphic_id}`;
}
