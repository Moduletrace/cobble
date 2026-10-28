import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import {
    PwaInstallIconRenderRevision,
    PwaInstallIconSettingKey,
    type PwaInstallIcon,
    type PwaInstallIconMode,
} from "@/src/data/pwa-data";
import type { BotHue } from "@/src/dict/bot-dict";
import saveAppSetting from "@/src/functions/backend/db/app-settings/save-app-setting";
import renderInstallIcons from "@/src/functions/server/pwa/render-install-icons";
import AppError from "@/src/utils/app-error";
import grabDirNames from "@/src/utils/grab-dir-names";
import grabInstallIconDir from "./grab-install-icon-dir";
import grabPwaBackground from "./grab-pwa-background";
import normalizeInstallIconUpload from "./normalize-install-icon-upload";

type Params = {
    mode: PwaInstallIconMode;
    stone: BotHue;
    mark: boolean;
    /**
     * A newly picked image, decoded already.
     */
    image?: Buffer | null;
};

/**
 * Saves the install's icon and draws its icon set. A new image replaces
 * the stored one; going back to a stone drops it. The ember stone is the
 * stock icon, so it needs no set. Older sets are removed once the new one
 * is in place; each has its own folder, so a cached icon is never stale.
 */
export default async function saveInstallIcon({ mode, stone, mark, image }: Params) {
    const dir = grabInstallIconDir();
    const source_path = path.join(dir, "source.png");
    const background = await grabPwaBackground();

    await mkdir(dir, { recursive: true });

    if (image) {
        await writeFile(source_path, await normalizeInstallIconUpload({ buffer: image, background }));
    }

    if (mode == "stone") {
        await rm(source_path, { force: true });
    }

    if (mode == "image" && !existsSync(source_path)) {
        throw new AppError(`Upload an image first.`);
    }

    const source = mode == "image" ? Buffer.from(await Bun.file(source_path).arrayBuffer()) : null;
    const is_stock = mode == "stone" && stone == "ember";

    const version = is_stock
        ? null
        : createHash("sha256")
              .update(JSON.stringify({ mode, stone, mark, render: PwaInstallIconRenderRevision }))
              .update(source || "")
              .digest("hex")
              .slice(0, 12);

    const icon: PwaInstallIcon = { mode, stone, mark, version };

    if (version) {
        const stone_svg = Buffer.from(
            await Bun.file(
                path.join(grabDirNames().ROOT_DIR, "public/brand/icons", `${stone}.svg`),
            ).arrayBuffer(),
        );
        const files = await renderInstallIcons({ icon, stone_svg, image: source, background });
        const set_dir = path.join(dir, version);

        await mkdir(set_dir, { recursive: true });

        for (const [name, bytes] of Object.entries(files)) {
            await writeFile(path.join(set_dir, `${name}.png`), bytes);
        }
    }

    for (const entry of await readdir(dir, { withFileTypes: true })) {
        if (entry.isDirectory() && entry.name != version) {
            await rm(path.join(dir, entry.name), { recursive: true, force: true });
        }
    }

    await saveAppSetting({
        key: PwaInstallIconSettingKey,
        value: is_stock ? null : JSON.stringify(icon),
    });

    return icon;
}
