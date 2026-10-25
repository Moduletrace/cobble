import path from "node:path";
import { PwaInstallIconFiles, PwaInstallIconRoute } from "@/src/data/pwa-data";
import grabInstallIconDir from "@/src/functions/backend/install-icon/grab-install-icon-dir";

const FilePattern = new RegExp(
    `^${PwaInstallIconRoute}/([a-f0-9]{12})/([a-z0-9-]+)\\.png$`,
);

/**
 * Serves the install's own icon set. Public, like `/icons/`: a browser
 * fetches install and notification icons without the session. Each set
 * has its own folder, so a file never changes and is cached for good.
 * Null for any other path.
 */
export default async function handleInstallIconFile({
    pathname,
}: {
    pathname: string;
}): Promise<Response | null> {
    if (!pathname.startsWith(`${PwaInstallIconRoute}/`)) return null;

    const match = pathname.match(FilePattern);
    const version = match?.[1];
    const name = match?.[2];

    if (!version || !name || !PwaInstallIconFiles.some((file) => file.name == name)) {
        return new Response("Not Found", { status: 404 });
    }

    const file = Bun.file(path.join(grabInstallIconDir(), version, `${name}.png`));

    if (!(await file.exists())) {
        return new Response("Not Found", { status: 404 });
    }

    const response = new Response(file, {
        headers: {
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=31536000, immutable",
            "X-Content-Type-Options": "nosniff",
        },
    });

    /**
     * `Bun.file` adds a filename disposition; an icon is shown inline.
     */
    response.headers.delete("content-disposition");

    return response;
}
