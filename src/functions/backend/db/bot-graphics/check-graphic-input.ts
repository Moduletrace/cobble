import { AppData } from "@/src/data/app-data";
import AppError from "@/src/utils/app-error";

type Params = {
    title?: string;
    html?: string;
};

/**
 * A graphic's title and HTML as they're stored: trimmed, the title one
 * line, the HTML within `AppData.BotGraphicMaxChars`. Throws an `AppError`
 * the bot can act on.
 */
export default function checkGraphicInput({ title, html }: Params) {
    const final_title = title?.replace(/\s+/g, " ").trim().slice(0, 200);
    const final_html = html?.trim();

    if (title !== undefined && !final_title) throw new AppError(`Give the graphic a title.`);
    if (html !== undefined && !final_html) throw new AppError(`The graphic's HTML is empty.`);

    if (final_html && final_html.length > AppData.BotGraphicMaxChars) {
        throw new AppError(
            `The HTML is ${final_html.length} characters; a graphic holds at most ${AppData.BotGraphicMaxChars}. Make it leaner: draw with SVG or a chart library instead of inlining data or images.`,
        );
    }

    return { title: final_title, html: final_html };
}
