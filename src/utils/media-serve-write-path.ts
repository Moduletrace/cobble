type Params = {
    media: {
        media_write_path?: string | null;
        media_thumbnail_write_path?: string | null;
    };
    /**
     * Whether the request is for `/media/<id>/thumbnail` rather than the
     * original.
     */
    thumbnail?: boolean;
};

/**
 * Which file a media URL serves: the original, or an image's smaller copy
 * for a thumbnail request. A thumbnail falls back to the original when no
 * smaller copy was made (bot files keep none), so the URL always loads
 * instead of answering a 404.
 */
export default function mediaServeWritePath({ media, thumbnail }: Params): string | null | undefined {
    if (!thumbnail) return media.media_write_path;

    return media.media_thumbnail_write_path || media.media_write_path;
}
