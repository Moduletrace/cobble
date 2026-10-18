import type { UserFormObject } from "@/src/types";

/**
 * The `users` columns the profile page edits.
 */
export const ProfileFields: (keyof UserFormObject)[] = [
    "first_name",
    "last_name",
    "email",
    "username",
    "bio",
];
