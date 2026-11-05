type Params = {
    text: string;
    /**
     * Playwright MCP's output folder (`AppData.ComputerBrowserOutputDir`),
     * outside every run's folders.
     */
    output_dir: string;
};

/**
 * A browser tool's result with no links into Playwright MCP's output
 * folder, which the bot can't read: a page snapshot or the console log
 * points at the tool that reads it
 * (`browser_snapshot`, `browser_console_messages`), and any other file
 * there (a screenshot, already shown as an image) is left out.
 */
export default function browserOutputText({ text, output_dir }: Params) {
    const dir = output_dir.replace(/\/+$/, "");
    const inDir = (path: string) => path.startsWith(`${dir}/`);

    return text
        .split("\n")
        .flatMap((line) => {
            const console_link = line.match(/^- New console entries: (\S+)$/);

            if (console_link && inDir(console_link[1]!)) {
                return ["- New console entries: read them with browser_console_messages"];
            }

            const link = line.match(/^- \[([^\]]*)\]\(([^)\n]+)\)$/);

            if (link && inDir(link[2]!)) {
                return /\.ya?ml$/i.test(link[2]!) ? ["- Not shown here: call browser_snapshot to read the page"] : [];
            }

            return [line];
        })
        .join("\n");
}
