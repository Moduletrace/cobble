type Params = {
    id?: number | string | null | "";
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
};

/**
 * How a user is named on a page: their full name, else their email, else
 * "User <id>".
 */
export default function personName({ id, first_name, last_name, email }: Params) {
    return [first_name, last_name].filter(Boolean).join(" ").trim() || email || `User ${id || ""}`.trim();
}
