/**
 * Pages that fill the window without the rail: a bot graphic's own page
 * (`/admin/bots/<bot>/graphics/<id>`), which is about one graphic and
 * leads back to its conversation from its header.
 */
export default function isRaillessPage({ pathname }: { pathname?: string | null }) {
    return /^\/admin\/bots\/\d+\/graphics\/\d+\/?$/.test(pathname || "");
}
