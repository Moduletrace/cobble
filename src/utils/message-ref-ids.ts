/**
 * The bots (`[bot:ID]`) and workspaces (`[workspace:ID]`) some messages
 * name, each id once. Refs that are markdown links (`[bot:3](...)`) don't
 * count.
 */
export default function messageRefIds({ texts }: { texts: string[] }) {
    const bot_ids = new Set<number>();
    const workspace_ids = new Set<number>();

    for (const text of texts) {
        for (const [, kind, id] of text.matchAll(/\[(bot|workspace):(\d+)\](?!\()/g)) {
            (kind == "bot" ? bot_ids : workspace_ids).add(Number(id));
        }
    }

    return { bot_ids: [...bot_ids], workspace_ids: [...workspace_ids] };
}
