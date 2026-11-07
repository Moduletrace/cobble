/**
 * Whether a tool is a browser's: the computer's Playwright MCP
 * (`browser_*`) or a user's own browser (`<slug>__browser_*`). With
 * `action`, whether it is that browser tool exactly (`browser_snapshot`
 * matches `browser_snapshot` and `my_pc__browser_snapshot`).
 */
export default function isBrowserTool({ name, action }: { name: string; action?: string }) {
    const match = name.match(/(?:^|__)(browser_[a-z0-9_]+)$/i);

    if (!match) return false;

    return action ? match[1] == action : true;
}
