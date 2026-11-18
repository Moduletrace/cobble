type Params = {
    /**
     * The folder on the host machine, as `hostDirectoryPath` returned it.
     */
    source: string;
    /**
     * The accounts of every bot that sees the folder, from
     * `hostDirectoryLinkUids`: each gets an ACL entry of its own.
     */
    uids?: number[];
};

/**
 * The commands that give the accounts a computer's bots work as the right
 * to read and write a host folder, for the user to run on the host: this
 * app never runs them, since the folder is theirs.
 *
 * One ACL entry per account, for what is in the folder now and, as a
 * default entry on its folders, for what the bots make there next: a file
 * a bot writes is shared with the others even though its own account owns
 * it. Nothing is chowned or chgrp'ed and no mode is changed, so a folder
 * that is the user's keeps its owner and its group. The result is one
 * line, joined so it can be pasted whole; empty when there is no account
 * to give.
 */
export default function hostDirectoryPermissionCommand({
    source,
    uids = [],
}: Params) {
    const accounts = [...new Set(uids)]
        .filter((uid) => Number.isInteger(uid) && uid > 0)
        .sort((a, b) => a - b);

    if (!accounts.length) return "";

    const folder = shellQuote({ text: source });
    const entries = accounts.map((uid) => `u:${uid}:rwX`).join(",");
    const default_entries = accounts.map((uid) => `d:u:${uid}:rwX`).join(",");

    return [
        `sudo setfacl -R -m ${entries} ${folder}`,
        `sudo find ${folder} -type d -exec setfacl -m ${default_entries} {} +`,
    ].join(" && ");
}

/**
 * A path as one argument of a shell command: bare when it is plainly a
 * path, quoted otherwise, so a space or a quote in it can't split the
 * command the user pastes.
 */
function shellQuote({ text }: { text: string }) {
    if (/^[A-Za-z0-9_@%+=:,./-]+$/.test(text)) return text;

    return `'${text.replace(/'/g, `'\\''`)}'`;
}