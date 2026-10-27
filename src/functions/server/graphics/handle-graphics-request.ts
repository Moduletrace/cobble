import path from "node:path";
import { GraphicsLibPrefix, GraphicsLibs, GraphicsPrefix } from "@/src/dict/graphics-dict";
import userAuth from "@/src/functions/backend/auth/user-auth";
import grabBotGraphic from "@/src/functions/backend/db/bot-graphics/grab-bot-graphic";
import graphicDocument from "@/src/utils/graphic-document";
import graphicHeaders from "@/src/utils/graphic-headers";
import isSecureRequest from "@/src/utils/is-secure-request";
import grabGraphicThemeVars from "./grab-graphic-theme-vars";

type Params = {
    req: Request;
    url: URL;
};

/**
 * Serves bot graphics and the libraries they may load:
 *
 * - `/graphics/<id>[?theme=dark]`: the graphic, for the user it was made
 *   for only (anyone else, signed in or not, gets the same 404), themed
 *   and sandboxed (`graphicHeaders`).
 * - `/graphics-lib/<file>`: a library from `GraphicsLibs`, public (a
 *   sandboxed graphic sends no cookie of the app's) and cached for a day.
 *
 * Null for any other path.
 */
export default async function handleGraphicsRequest({ req, url }: Params): Promise<Response | null> {
    if (url.pathname.startsWith(`${GraphicsLibPrefix}/`)) {
        return await serveLib({ file: url.pathname.slice(GraphicsLibPrefix.length + 1) });
    }

    if (!url.pathname.startsWith(`${GraphicsPrefix}/`)) return null;

    const id = url.pathname.slice(GraphicsPrefix.length + 1).replace(/\/$/, "");

    if (req.method != "GET" || !/^\d+$/.test(id)) return notFound();

    const { user } = await userAuth({ req });

    if (!user?.id) return notFound();

    const graphic = await grabBotGraphic({ graphic_id: id, user_id: user.id });

    if (!graphic?.html) return notFound();

    const origin = `${isSecureRequest({ req }) ? "https" : "http"}://${req.headers.get("host") || url.host}`;

    return new Response(
        graphicDocument({
            html: graphic.html,
            title: graphic.title || `Graphic ${graphic.id}`,
            dark: url.searchParams.get("theme") == "dark",
            vars: grabGraphicThemeVars(),
        }),
        { headers: graphicHeaders({ origin }) },
    );
}

async function serveLib({ file }: { file: string }) {
    const lib = GraphicsLibs.find((it) => it.file == file);

    if (!lib) return notFound();

    const source = Bun.file(path.join(process.cwd(), lib.source));

    if (!(await source.exists())) return notFound();

    const response = new Response(source, {
        headers: {
            "Content-Type": "text/javascript; charset=utf-8",
            "Cache-Control": "public, max-age=86400",
            "X-Content-Type-Options": "nosniff",
        },
    });

    response.headers.delete("content-disposition");

    return response;
}

function notFound() {
    return new Response("Not Found", { status: 404, headers: { "Cache-Control": "no-store" } });
}
