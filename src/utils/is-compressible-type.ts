type Params = {
    content_type?: string | null;
};

/**
 * Whether a response of this content type is text worth compressing:
 * pages, scripts, styles, JSON, SVG and the like. Media, fonts and
 * streams (`text/event-stream`) are left as they are.
 */
export default function isCompressibleType({ content_type }: Params): boolean {
    const type = content_type?.split(";")[0]?.trim().toLowerCase();

    if (!type || type == "text/event-stream") return false;
    if (type.startsWith("text/")) return true;

    return /^application\/(javascript|json|manifest\+json|xml|[\w.-]+\+json|[\w.-]+\+xml)$/.test(type) ||
        type == "image/svg+xml";
}
