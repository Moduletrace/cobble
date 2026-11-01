import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import BrowserCommandBlock from "./browser-command-block";

const Command = `chromium --remote-debugging-port=9222 --user-data-dir=$HOME/.cobble-browser

npx @playwright/mcp --cdp-endpoint http://127.0.0.1:9222 \\
  --port 8931 --host 0.0.0.0 \\
  --allowed-hosts host.docker.internal:8931`;

const FlatpakCommand = `flatpak run org.chromium.Chromium --remote-debugging-port=9222 --user-data-dir=$HOME/.cobble-browser`;

/**
 * The way that's been tested: Playwright MCP attached to a running
 * browser. `--allowed-hosts` must name exactly the host and port in the
 * URL, or the server refuses every connection.
 */
export default function BrowserSetupHelp() {
    return (
        <Stack className="w-full gap-2! items-stretch">
            <Span className="text-[13px] leading-[18px] text-ink-secondary">
                On the machine with the browser, start it with remote debugging, then Playwright MCP beside it. Chrome
                refuses remote debugging on your everyday profile, so this opens a profile of its own: sign in there to
                what bots should reach. On the same machine as this app the URL is
                http://host.docker.internal:8931/mcp. From another machine, use its private address, and name that
                address in --allowed-hosts.
            </Span>
            <BrowserCommandBlock command={Command} />
            <Span className="text-[13px] leading-[18px] text-ink-secondary">
                Browser installed as a Flatpak? Start it with this instead, and run Playwright MCP on the host as above.
                Other Flatpak browsers use their own app id. Close any window already using that profile first.
            </Span>
            <BrowserCommandBlock command={FlatpakCommand} />
        </Stack>
    );
}
