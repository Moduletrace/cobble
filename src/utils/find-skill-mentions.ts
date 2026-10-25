import literalUrlHost from "./literal-url-host";

type Params = {
    text: string;
};

const UrlPattern = /https?:\/\/[^\s)<>\]"'`]+/gi;
const ToolPattern = /\b[a-z][a-z0-9]*(?:__?[a-z0-9]+)+\b/g;
const SecretPatterns = [
    /\{\{\s*env\s*\.[^}]*\}\}/gi,
    /~?\/?\.cobble\/[\w.\/-]*/gi,
    /\benv\.json\b/gi,
    /\$\{?[A-Z][A-Z0-9_]{2,}\}?/g,
    /\b(?:process\.env|os\.environ)\b/g,
    /\b(?:api[ _-]?keys?|access[ _-]?tokens?|tokens?|passwords?|secrets?|credentials?|cookies?|private[ _-]?keys?)\b/gi,
];
const MaxEach = 30;

/**
 * What a skill's runbook would have bots reach for, read from its text
 * by the app so the confirm card never depends on the bot's account of
 * it: the links in it and their hosts, every snake_case name (what tools
 * are called, e.g. `web_fetch_exa`, `exa_search__web_fetch_exa`), and
 * anything that touches secrets (envs, `~/.cobble/env`, `$API_KEY`,
 * words like token or password). Each list is deduplicated and capped.
 */
export default function findSkillMentions({ text }: Params) {
    const urls = unique({ values: [...text.matchAll(UrlPattern)].map((m) => m[0].replace(/[.,;:!?]+$/, "")) });
    const hosts = unique({
        values: urls.map((url) => literalUrlHost({ url })).filter((host): host is string => Boolean(host)),
    });
    const tools = unique({ values: [...text.matchAll(ToolPattern)].map((m) => m[0]) });
    const secrets = unique({
        values: SecretPatterns.flatMap((pattern) => [...text.matchAll(pattern)].map((m) => m[0].trim())),
        fold: true,
    });

    return { urls, hosts, tools, secrets };
}

function unique({ values, fold }: { values: string[]; fold?: boolean }) {
    const seen = new Set<string>();
    const kept: string[] = [];

    for (const value of values) {
        const id = fold ? value.toLowerCase() : value;

        if (!value || seen.has(id)) continue;

        seen.add(id);
        kept.push(value);
    }

    return kept.slice(0, MaxEach);
}
