type Params = {
    id?: number | "";
    author?: string;
    text: string;
    created_at?: number | "";
};

/**
 * One message of an earlier session, as a bot reads it: its id (to read
 * around it or reply to it), when, who, and the text.
 */
export default function describePastMessage({ id, author, text, created_at }: Params) {
    const when = created_at ? new Date(Number(created_at)).toUTCString() : "";

    return `#${id} ${when ? `(${when}) ` : ""}${author == "user" ? "User" : "You"}: ${text.trim() || "(files only)"}`;
}
