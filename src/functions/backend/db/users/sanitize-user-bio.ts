import sanitizeRichTextHtml from "@/src/utils/sanitize-rich-text-html";

type UserWithBio = {
    bio?: string | null;
};

type Params<T extends UserWithBio> = {
    user: T;
};

/**
 * # Sanitize a user's `bio` HTML.
 * The `bio` column is editable by every logged-in user (including
 * `read_only`) and rendered with `dangerouslySetInnerHTML`, so it must be
 * sanitized on write and before render.
 */
export default function sanitizeUserBio<T extends UserWithBio>({
    user,
}: Params<T>): T {
    if (typeof user.bio !== "string" || !user.bio) {
        return user;
    }

    return {
        ...user,
        bio: sanitizeRichTextHtml({ html: user.bio }),
    } as T;
}
