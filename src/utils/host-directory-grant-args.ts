/**
 * The script a throwaway container runs as root to give bot accounts access
 * to a host folder, and to take it away again: an ACL entry per account on
 * everything already there, and a default entry on its folders so what a bot
 * makes there next is shared with the others too.
 *
 * Only ACL entries are touched: nothing is chowned or chgrp'ed and no mode
 * is changed, so the folder keeps the owner, group and permissions the user
 * gave it. Run as `sh -c <script> sh <folder> add:<uid> remove:<uid> ...`,
 * with the folder as `$1`.
 */
export const HostDirectoryGrantScript = `
target="$1"
shift
status=0

for entry in "$@"; do
    mode="\${entry%%:*}"
    uid="\${entry#*:}"

    if [ "$mode" = "add" ]; then
        setfacl -R -m "u:$uid:rwX" "$target" || status=1
        find "$target" -type d -exec setfacl -m "d:u:$uid:rwX" {} + || status=1
    else
        setfacl -R -x "u:$uid" "$target" || status=1
        find "$target" -type d -exec setfacl -x "d:u:$uid" {} + || status=1
    fi
done

exit $status
`;

type Params = {
    added?: number[];
    removed?: number[];
};

/**
 * The account arguments the script takes, added first: `add:100004`.
 */
export default function hostDirectoryGrantArgs({
    added = [],
    removed = [],
}: Params): string[] {
    const gain = [...new Set(added)].filter((uid) => Number.isInteger(uid) && uid > 0);
    const loss = [...new Set(removed)].filter(
        (uid) => Number.isInteger(uid) && uid > 0 && !gain.includes(uid),
    );

    return [
        ...gain.sort((a, b) => a - b).map((uid) => `add:${uid}`),
        ...loss.sort((a, b) => a - b).map((uid) => `remove:${uid}`),
    ];
}