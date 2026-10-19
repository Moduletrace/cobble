type Params = {
    /**
     * A bot's or workspace's `image_media_id`.
     */
    media_id?: number | string | null;
};

/**
 * Where a bot's or workspace's picture is served (a private image, so
 * only its owner can load it). Empty when it has none.
 */
export default function profileImageUrls({ media_id }: Params) {
    if (!media_id) return {};

    const src = `/media/private/${media_id}`;

    return { src, thumbnail_src: `${src}/thumbnail` };
}
