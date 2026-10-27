import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import { useEffect, useState } from "react";
import type { BotGraphicView } from "@/src/types";

type Params = {
    graphic_id: number;
};

/**
 * Graphics read lately, by id, so a thread naming one twice asks once. An
 * entry is read again after `FreshMs`, since a bot may have changed it.
 */
const loaded = new Map<number, { at: number; view: Promise<BotGraphicView | null> }>();
const FreshMs = 10_000;

function loadGraphic({ graphic_id }: Params) {
    const cached = loaded.get(graphic_id);

    if (cached && Date.now() - cached.at < FreshMs) return cached.view;

    const view = fetchApi<{}, APIResponseObject<BotGraphicView>>(
        `/api/admin/graphics/get-graphic?graphic_id=${graphic_id}`,
        { method: "GET" },
    )
        .then((res) => (res?.success && res.singleRes ? res.singleRes : null))
        .catch(() => null);

    loaded.set(graphic_id, { at: Date.now(), view });

    return view;
}

/**
 * A graphic a bot named (`[graphic:ID]`), for its card: its title, bot and
 * version. Only the user it was made for reads it; anyone else gets null.
 */
export default function useBotGraphic({ graphic_id }: Params) {
    const [view, setView] = useState<BotGraphicView | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let live = true;

        loadGraphic({ graphic_id }).then((result) => {
            if (!live) return;
            setView(result);
            setLoading(false);
        });

        return () => {
            live = false;
        };
    }, [graphic_id]);

    return { view, loading };
}
