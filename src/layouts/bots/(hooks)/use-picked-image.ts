import { useState } from "react";

type Params = {
    /**
     * The record's saved picture.
     */
    image_media_id?: number | string | null;
};

/**
 * A picture being changed in a form: a newly picked one (as a data URL),
 * or the saved one removed. `changed` says whether to save anything.
 */
export default function usePickedImage({ image_media_id }: Params) {
    const [data_url, setDataUrl] = useState<string>();
    const [removed, setRemoved] = useState(false);

    return {
        data_url,
        /**
         * What the preview should show: the picked one, else the saved one
         * unless removed.
         */
        image_media_id: removed ? null : image_media_id,
        has_image: Boolean(data_url || (image_media_id && !removed)),
        changed: Boolean(data_url) || (removed && Boolean(image_media_id)),
        pick: ({ data_url }: { data_url: string }) => {
            setDataUrl(data_url);
            setRemoved(false);
        },
        remove: () => {
            setDataUrl(undefined);
            setRemoved(true);
        },
    };
}
