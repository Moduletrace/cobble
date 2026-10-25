import path from "node:path";
import grabDirNames from "@/src/utils/grab-dir-names";

/**
 * The paper colour the app icons sit on: the generated manifest's
 * `background_color` (from `main.css`, by `bun run gen:favicon`).
 */
export default async function grabPwaBackground() {
    const manifest = await Bun.file(path.join(grabDirNames().ROOT_DIR, "public/manifest.webmanifest"))
        .json()
        .catch(() => null);

    const color = manifest?.background_color;

    return typeof color == "string" && /^#[0-9a-f]{6}$/i.test(color) ? color : "#ffffff";
}
