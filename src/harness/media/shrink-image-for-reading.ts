import sharp from "sharp";
import { AppData } from "@/src/data/app-data";

type Params = {
    /**
     * The image a vision harness would read: a `data:` URL, or an https
     * one (an attachment or a media link).
     */
    url: string;
};

const DataUrl = /^data:(image\/(?:png|jpeg|jpg|webp));base64,(.+)$/i;

/**
 * The image a vision harness is about to read, made no larger than
 * `AppData.HarnessVisionImageMaxSide` on its longest side.
 *
 * Every read pays for the image's pixels: a screenshot of a 1920 wide
 * window is about three times the image tokens of a 1024 one, and two to
 * three times the wait, while the text a reading is for is still legible.
 * Images already within the cap, anything that isn't an inline image (an
 * https attachment is left to the provider's own fetching) and anything
 * sharp can't decode are returned exactly as given, so a read never fails
 * over this.
 */
export default async function shrinkImageForReading({ url }: Params): Promise<string> {
    const match = DataUrl.exec(url);
    if (!match) return url;

    const [, declared = "", base64 = ""] = match;

    try {
        const image = sharp(Buffer.from(base64, "base64"), { animated: false });
        const { width, height } = await image.metadata();

        if (!width || !height) return url;
        if (Math.max(width, height) <= AppData.HarnessVisionImageMaxSide) return url;

        const type = declared.toLowerCase() == "image/jpg" ? "image/jpeg" : declared.toLowerCase();
        const size = {
            width: AppData.HarnessVisionImageMaxSide,
            height: AppData.HarnessVisionImageMaxSide,
            fit: "inside" as const,
            withoutEnlargement: true,
        };
        const resized =
            type == "image/jpeg"
                ? await image.resize(size).jpeg({ quality: 80 }).toBuffer()
                : await image.resize(size).png().toBuffer();

        return `data:${type};base64,${resized.toString("base64")}`;
    } catch {
        return url;
    }
}