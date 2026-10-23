type Params = {
    /**
     * A file name, e.g. `report.pdf`.
     */
    name?: string | null;
    /**
     * Its MIME type, used when the name has no extension.
     */
    mime_type?: string | null;
};

/**
 * A file's extension, lower case and without the dot: from its name, else
 * from its MIME type. Anything but letters and digits is stripped, so a
 * hostile name can't turn into a path.
 */
export default function extensionOf({ name, mime_type }: Params) {
    const from_name = name?.includes(".") ? name.split(".").pop() : undefined;

    if (from_name) return from_name.toLowerCase().replace(/[^a-z0-9]/g, "");

    const from_mime =
        mime_type && !mime_type.includes("octet-stream")
            ? mime_type.split("/").pop()
            : undefined;

    return from_mime ? from_mime.toLowerCase().replace(/[^a-z0-9]/g, "") : undefined;
}
