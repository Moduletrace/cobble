/**
 * The only `media` columns writable through the CRUD API: what describes a
 * file, never where it lives (`media_write_path`,
 * `media_thumbnail_write_path`), whose it is (`user_id`) or what it is
 * (`media_type`, `mime_type`). Those are set by the upload routes alone,
 * since a path written here would be served or deleted as is.
 */
export const MediaUpdatableFields = [
    "title",
    "description",
    "summary",
    "text_content",
    "is_primary",
    "archived",
] as const;
