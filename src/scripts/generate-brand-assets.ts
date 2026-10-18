import { existsSync, mkdirSync, writeFileSync } from "fs";
import path from "path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dir, "../..");
const LOGO_SVG = path.join(ROOT, "public/logos/logo.svg");
const PUBLIC_DIR = path.join(ROOT, "public");

const ICO_SIZES = [16, 24, 32, 48] as const;
const PNG_SIZES = [...ICO_SIZES, 180, 512] as const;

function buildIco(pngs: Record<number, Buffer>): Buffer {
    const header = Buffer.alloc(6);
    header.writeUInt16LE(0, 0);
    header.writeUInt16LE(1, 2);
    header.writeUInt16LE(ICO_SIZES.length, 4);

    const entries: Buffer[] = [];
    const blobs: Buffer[] = [];
    let offset = 6 + 16 * ICO_SIZES.length;

    for (const size of ICO_SIZES) {
        const blob = pngs[size]!;
        const entry = Buffer.alloc(16);
        entry.writeUInt8(size, 0);
        entry.writeUInt8(size, 1);
        entry.writeUInt8(0, 2);
        entry.writeUInt8(0, 3);
        entry.writeUInt16LE(1, 4);
        entry.writeUInt16LE(32, 6);
        entry.writeUInt32LE(blob.length, 8);
        entry.writeUInt32LE(offset, 12);
        offset += blob.length;
        entries.push(entry);
        blobs.push(blob);
    }

    return Buffer.concat([header, ...entries, ...blobs]);
}

async function main() {
    if (!existsSync(LOGO_SVG)) {
        throw new Error(`Logo SVG not found at ${LOGO_SVG}`);
    }

    const svg = await Bun.file(LOGO_SVG).arrayBuffer();

    const pngs: Record<number, Buffer> = {};
    for (const size of PNG_SIZES) {
        pngs[size] = await sharp(Buffer.from(svg))
            .resize(size, size)
            .png()
            .toBuffer();
    }

    writeFileSync(path.join(PUBLIC_DIR, "favicon.png"), pngs[32]!);
    writeFileSync(path.join(PUBLIC_DIR, "favicon.ico"), buildIco(pngs));
    writeFileSync(
        path.join(PUBLIC_DIR, "apple-touch-icon.png"),
        pngs[180]!,
    );
    mkdirSync(path.join(PUBLIC_DIR, "logos"), { recursive: true });
    writeFileSync(path.join(PUBLIC_DIR, "logos/logo.png"), pngs[512]!);

    console.log("Generated brand assets from public/logos/logo.svg:");
    console.log("  public/favicon.ico           (16/24/32/48 multi-size)");
    console.log("  public/favicon.png           (32x32)");
    console.log("  public/apple-touch-icon.png  (180x180)");
    console.log("  public/logos/logo.png        (512x512)");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Brand asset generation failed:", error);
        process.exit(1);
    });