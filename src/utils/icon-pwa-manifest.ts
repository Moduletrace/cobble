type ManifestIcon = { src?: unknown };

type Params = {
    manifest: Record<string, unknown>;
    /**
     * The install's icon set (`installIconBase`), or null for the stock one.
     */
    icon_base?: string | null;
};

/**
 * The manifest pointed at the install's own icon set: every icon under
 * `/icons/` (the app's and its shortcuts') moves to `icon_base`, which
 * holds the same file names.
 */
export default function iconPwaManifest({ manifest, icon_base }: Params) {
    if (!icon_base) return manifest;

    const move = (icons: unknown) =>
        Array.isArray(icons)
            ? icons.map((icon: ManifestIcon) =>
                  typeof icon?.src == "string" && icon.src.startsWith("/icons/")
                      ? { ...icon, src: `${icon_base}/${icon.src.slice("/icons/".length)}` }
                      : icon,
              )
            : icons;

    return {
        ...manifest,
        icons: move(manifest.icons),
        shortcuts: Array.isArray(manifest.shortcuts)
            ? manifest.shortcuts.map((shortcut: Record<string, unknown>) => ({
                  ...shortcut,
                  icons: move(shortcut.icons),
              }))
            : manifest.shortcuts,
    };
}
