import { GraphicSizeMessageType } from "@/src/dict/graphics-dict";
import type { ThemeVars } from "./parse-theme-vars";

type Params = {
    /**
     * The graphic as the bot wrote it: a whole document or a fragment.
     */
    html: string;
    title: string;
    dark?: boolean;
    vars: ThemeVars;
};

/**
 * A bot graphic as it's served: the app's theme colours and fonts set
 * ahead of the bot's own styles (as `--c-paper`, `--c-ink`, ... and
 * `--font-sans`), `dark` on the root in the dark theme, and a script that
 * tells the thread how tall it is. A fragment is wrapped into a document;
 * a refresh tag (which would navigate the frame away) is dropped.
 */
export default function graphicDocument({ html, title, dark, vars }: Params) {
    const head = `<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeText(title)}</title><style>${themeCss({ vars })}</style><script>document.documentElement.classList.toggle("dark", ${dark ? "true" : "false"});</script>`;
    const tail = `<script>${SizeScript}</script>`;
    const body = html.replace(/<meta\b[^>]*http-equiv\s*=\s*["']?refresh[^>]*>/gi, "");

    const with_head = /<head\b[^>]*>/i.test(body)
        ? body.replace(/<head\b[^>]*>/i, (tag) => `${tag}${head}`)
        : /<html\b[^>]*>/i.test(body)
          ? body.replace(/<html\b[^>]*>/i, (tag) => `${tag}<head>${head}</head>`)
          : `<!DOCTYPE html><html><head>${head}</head><body>${body}</body></html>`;

    const last_body_end = with_head.toLowerCase().lastIndexOf("</body>");

    const document =
        last_body_end >= 0
            ? `${with_head.slice(0, last_body_end)}${tail}${with_head.slice(last_body_end)}`
            : `${with_head}${tail}`;

    return /^\s*<!doctype/i.test(document) ? document : `<!DOCTYPE html>${document}`;
}

/**
 * Posts the body's height to the page framing it whenever it changes.
 */
const SizeScript = `(function(){var last=0;function post(){var b=document.body;if(!b)return;var h=Math.ceil(b.scrollHeight);if(h==last)return;last=h;parent.postMessage({type:${JSON.stringify(GraphicSizeMessageType)},height:h},"*");}if(window.ResizeObserver&&document.body){new ResizeObserver(post).observe(document.body);}addEventListener("load",post);post();})();`;

/**
 * Thin scrollbars in the theme's colours, for the graphic and anything in
 * it that scrolls: a rounded thumb inset in a clear track where the
 * browser takes `::-webkit-scrollbar` (Chrome, Safari), the standard
 * properties elsewhere (Firefox), since Chrome drops the rounded thumb
 * once those are set.
 */
const ScrollbarCss = [
    `::-webkit-scrollbar{width:10px;height:10px;}`,
    `::-webkit-scrollbar-track,::-webkit-scrollbar-corner{background:transparent;}`,
    `::-webkit-scrollbar-thumb{background-color:var(--c-border-strong);border:3px solid transparent;border-radius:999px;background-clip:padding-box;}`,
    `::-webkit-scrollbar-thumb:hover{background-color:var(--c-ink-secondary);}`,
    `@supports not selector(::-webkit-scrollbar){*{scrollbar-width:thin;scrollbar-color:var(--c-border-strong) transparent;}}`,
].join("");

function themeCss({ vars }: { vars: ThemeVars }) {
    const list = (record: Record<string, string>) =>
        Object.entries(record)
            .map(([name, value]) => `${name}:${value};`)
            .join("");

    return [
        `:root{color-scheme:light;${list(vars.light)}${list(vars.fonts)}}`,
        `:root.dark{color-scheme:dark;${list(vars.dark)}}`,
        `html,body{margin:0;}`,
        `body{padding:16px;background:var(--c-paper);color:var(--c-ink);font-family:var(--font-sans);font-size:14px;line-height:1.5;}`,
        ScrollbarCss,
    ].join("");
}

function escapeText(text: string) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
