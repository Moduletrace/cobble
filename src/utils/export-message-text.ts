type Params = {
    text: string;
    /**
     * Names by id; a ref to anything missing reads "a bot" / "a workspace".
     */
    bot_names: Record<number, string>;
    workspace_names: Record<number, string>;
    /**
     * How many levels the message's own headings drop, so they sit under
     * the heading of the message they are in. Capped at `######`.
     */
    heading_offset: number;
};

/**
 * A message's markdown as it reads outside the app: its refs in words
 * (`[bot:3]` as `@Ada`, `[workspace:2]` as `#Launch`, `[computer:3]` as
 * "computer 3", a folder as its path) and its headings dropped by
 * `heading_offset`. Code blocks are left exactly as they are.
 */
export default function exportMessageText({
    text,
    bot_names,
    workspace_names,
    heading_offset,
}: Params) {
    let fence: string | null = null;

    return text
        .split("\n")
        .map((line) => {
            const marker = line.match(/^\s{0,3}(`{3,}|~{3,})/)?.[1];

            if (fence) {
                if (marker && marker[0] == fence[0] && marker.length >= fence.length) {
                    fence = null;
                }

                return line;
            }

            if (marker) {
                fence = marker;
                return line;
            }

            return wordRefs({ line, bot_names, workspace_names }).replace(
                /^(\s{0,3})(#{1,6})(?=\s|$)/,
                (_, indent: string, hashes: string) =>
                    `${indent}${"#".repeat(Math.min(6, hashes.length + heading_offset))}`,
            );
        })
        .join("\n")
        .trim();
}

/**
 * One line's refs in words. Refs that are already markdown links
 * (`[bot:3](...)`) are left alone, as the chat leaves them.
 */
function wordRefs({
    line,
    bot_names,
    workspace_names,
}: {
    line: string;
    bot_names: Record<number, string>;
    workspace_names: Record<number, string>;
}) {
    return line
        .replace(/\[bot:(\d+)\](?!\()/g, (_, id: string) => {
            const name = bot_names[Number(id)];

            return name ? `@${name}` : "a bot";
        })
        .replace(/\[workspace:(\d+)\](?!\()/g, (_, id: string) => {
            const name = workspace_names[Number(id)];

            return name ? `#${name}` : "a workspace";
        })
        .replace(/\[computer:(\d+)\](?!\()/g, "computer $1")
        .replace(/\[take-over:(\d+):([a-z]+)\](?!\()/g, "(take over computer $1, $2)")
        .replace(/\[proposal:(\d+)\](?!\()/g, "proposal $1")
        .replace(/\[file:(\d+)\](?!\()/g, "file $1")
        .replace(/\[folder:[a-z]+:\d+:([^\]\n]+)\](?!\()/g, "`$1`")
        .replace(/\[folder:([a-z]+):(\d+)\](?!\()/g, "the $1 $2 folder");
}
