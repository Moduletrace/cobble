/**
 * The only `users` columns writable through the CRUD API. Anything else
 * (`id`, `archived`, timestamps) is stripped from insert/update payloads.
 */
export const UserUpdatableFields = [
    "first_name",
    "last_name",
    "email",
    "username",
    "bio",
] as const;
