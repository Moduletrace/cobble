import { AppData } from "@/src/data/app-data";
import AppError from "./app-error";

type Params = {
    label: string;
    text?: string | null;
};

/**
 * Throws if a prompt or memory is longer than `AppData.PromptMaxLength`.
 */
export default function assertPromptLength({ label, text }: Params) {
    if ((text?.length || 0) > AppData.PromptMaxLength) {
        throw new AppError(
            `${label} is too long (max ${AppData.PromptMaxLength} characters).`,
        );
    }
}
