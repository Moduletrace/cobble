export type SettingsRecordKind =
    | "bots"
    | "workspaces"
    | "users"
    | "computers";

export type SettingsRecordPath = {
    kind: SettingsRecordKind;
    id: string;
};

type Params = {
    pathname?: string | null;
};

/**
 * The record a nested settings page manages, e.g.
 * `/admin/settings/bots/3` -> `{ kind: "bots", id: "3" }`. Null on the
 * settings list pages and everywhere else.
 */
export default function parseSettingsRecordPath({
    pathname,
}: Params): SettingsRecordPath | null {
    if (!pathname) return null;

    const match = pathname
        .replace(/\/$/, "")
        .match(
            /^\/admin\/settings\/(bots|workspaces|users|computers)\/([^/]+)$/,
        );

    if (!match) return null;

    return {
        kind: match[1] as SettingsRecordKind,
        id: match[2]!,
    };
}
