import BunSQLite from "@moduletrace/bun-sqlite";
import { LogCategories } from "@/src/dict/log-categories";

export type LogCategory = (typeof LogCategories)[number]["value"];

export function grabRequestIP(req?: Request): string | undefined {
    if (!req) {
        return undefined;
    }

    const forwarded = req.headers.get("x-forwarded-for");

    if (forwarded) {
        return forwarded.split(",").shift()?.trim();
    }

    return req.headers.get("x-real-ip") || undefined;
}

export type LogDetail = {
    label: string;
    value: unknown;
};

export type LogEventParams = {
    title: string;
    category: LogCategory;
    user_id?: number;
    plain_text: string;
    markdown?: string;
    html?: string;
    details?: LogDetail[];
    metadata?: Record<string, unknown>;
    ip_address?: string;
};

function escapeHtml(value: string): string {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

export function buildLogFormats({
    plain_text,
    details = [],
}: {
    plain_text: string;
    details?: LogDetail[];
}): { markdown: string; html: string } {
    let markdown = plain_text;

    if (details.length) {
        markdown +=
            `\n\n| Field | Value |\n| --- | --- |\n` +
            details
                .map(
                    (detail) =>
                        `| ${detail.label} | \`${String(detail.value)}\` |`,
                )
                .join("\n");
    }

    const html_details = details.length
        ? `<table><tbody>` +
          details
              .map(
                  (detail) =>
                      `<tr><td><strong>${escapeHtml(detail.label)}</strong></td><td><code>${escapeHtml(
                          String(detail.value),
                      )}</code></td></tr>`,
              )
              .join("") +
          `</tbody></table>`
        : "";

    const html =
        `<p>${escapeHtml(plain_text).replaceAll("\n", "<br/>")}</p>` +
        html_details;

    return { markdown, html };
}

export default async function logEvent({
    title,
    category,
    user_id,
    plain_text,
    markdown,
    html,
    details,
    metadata,
    ip_address,
}: LogEventParams) {
    try {
        const formats = buildLogFormats({ plain_text, details });

        return await BunSQLite.insert({
            table: "logs",
            data: [
                {
                    title: title.slice(0, 255),
                    category,
                    user_id,
                    plain_text,
                    markdown: markdown || formats.markdown,
                    html: html || formats.html,
                    metadata: metadata ? JSON.stringify(metadata) : undefined,
                    ip_address,
                },
            ],
        });
    } catch (error) {
        return { success: false };
    }
}

export async function logError({
    title,
    category = "error",
    error,
    user_id,
    details,
    metadata,
    ip_address,
}: {
    title: string;
    category?: LogCategory;
    error: unknown;
    user_id?: number;
    details?: LogDetail[];
    metadata?: Record<string, unknown>;
    ip_address?: string;
}) {
    const error_message =
        error instanceof Error ? error.message : String(error);
    const error_stack =
        error instanceof Error && error.stack ? error.stack : undefined;

    return await logEvent({
        title,
        category,
        user_id,
        plain_text: `${title}: ${error_message}`,
        details: [
            ...(details || []),
            { label: "Error", value: error_message },
        ],
        metadata: {
            ...metadata,
            error_stack,
        },
        ip_address,
    });
}