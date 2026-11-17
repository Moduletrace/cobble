import type { McpAuthScheme } from "@/src/dict/mcp-dict";

/**
 * How a remote MCP server or a browser says who is calling: no
 * authorization, a bearer token in `Authorization`, or a token in a header
 * of its own name. `secret` is that token; only `header` uses `name`.
 */
export type McpAuth = {
    scheme: McpAuthScheme;
    name: string;
    secret: string;
};

/**
 * One header the user adds by hand, over the form's own fields.
 */
export type McpHeaderLine = {
    name: string;
    value: string;
};

type Headers = Record<string, string>;

const EnvTemplatePattern = /^\{\{\s*env\.([A-Za-z0-9_.-]+)\s*\}\}$/;

/**
 * The stored headers as the form's fields: the authorization the server was
 * saved with (`scheme` and `header_name`, when the row remembers them) takes
 * its header, and every other header is a hand-added one. Nothing is lost in
 * either direction.
 *
 * Without a remembered scheme (a row saved before the form had fields), the
 * `Authorization` header is guessed from: a bearer one becomes the bearer
 * token, anything else, Basic included, a hand-added header.
 */
export default function parseMcpHeaders({
    headers,
    scheme,
    header_name,
}: {
    headers?: Headers;
    scheme?: McpAuthScheme | "";
    header_name?: string;
} = {}): {
    auth: McpAuth;
    additional: McpHeaderLine[];
} {
    const entries = Object.entries(headers || {});
    const find = (name: string) =>
        entries.find(([entry]) => entry.trim().toLowerCase() == name.trim().toLowerCase());

    // Only these two are worth reading back as a choice of their own: a row
    // saved as `none` may still hold a bearer token added as a header, and
    // the guess below reads that the same way it always did.
    const saved_scheme = scheme == "bearer" || scheme == "header" ? scheme : "";
    const authorization = find("authorization");
    const token = authorization ? /^bearer\s+(.+)$/i.exec(authorization[1].trim())?.[1]?.trim() : undefined;

    const auth: McpAuth = !saved_scheme
        ? token
            ? { scheme: "bearer", name: "", secret: token }
            : { scheme: "none", name: "", secret: "" }
        : saved_scheme == "bearer"
          ? { scheme: "bearer", name: "", secret: token || authorization?.[1]?.trim() || "" }
          : saved_scheme == "header"
            ? { scheme: "header", name: (header_name || "").trim(), secret: (find(header_name || "")?.[1] || "").trim() }
            : { scheme: "none", name: "", secret: "" };

    const taken = auth.scheme == "bearer" ? "authorization" : auth.scheme == "header" ? auth.name : "";

    return {
        auth,
        additional: entries
            .filter(([name]) => !taken || name != find(taken)?.[0])
            .map(([name, value]) => ({ name, value })),
    };
}

/**
 * The headers the form's fields add up to (the other way from
 * `parseMcpHeaders`): the authorization choice wins a header of its own
 * name, and every hand-added header with a name is kept, even without a
 * value. Blank names are dropped.
 */
export function composeMcpHeaders({
    auth,
    additional,
}: {
    auth: McpAuth;
    additional: McpHeaderLine[];
}): Headers {
    const headers: Headers = {};
    const auth_name =
        auth.scheme == "bearer" && auth.secret.trim()
            ? "authorization"
            : auth.scheme == "header" && auth.name.trim()
              ? auth.name.trim().toLowerCase()
              : "";

    for (const line of additional) {
        const name = line.name.trim();

        if (!name || name.toLowerCase() == auth_name) continue;

        for (const existing of Object.keys(headers)) {
            if (existing.toLowerCase() == name.toLowerCase()) delete headers[existing];
        }

        headers[name] = line.value.trim();
    }

    if (auth.scheme == "bearer" && auth.secret.trim()) {
        headers["Authorization"] = `Bearer ${auth.secret.trim()}`;
    } else if (auth.scheme == "header" && auth.name.trim()) {
        headers[auth.name.trim()] = auth.secret.trim();
    }

    return headers;
}

/**
 * The env a value is exactly `{{env.KEY}}` for, so the picker can show it
 * as a chosen env; null for text of its own, a template in the middle of
 * one (`Basic {{env.CREDS}}`), or one naming `args`.
 */
export function envKeyFromTemplate({ text }: { text: string }): string | null {
    return EnvTemplatePattern.exec(text.trim())?.[1] || null;
}

/**
 * A value as a template naming one env.
 */
export function envTemplate(key: string) {
    return `{{env.${key}}}`;
}