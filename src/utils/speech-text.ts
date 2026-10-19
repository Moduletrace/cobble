import { AppData } from "@/src/data/app-data";
import messagePreview from "./message-preview";

/**
 * A bot message as text to read aloud: plain text (`messagePreview`),
 * take-over refs as "a take-over link", cut at `AppData.SpeechMaxChars`.
 */
export default function speechText({ text }: { text: string }) {
    const plain = messagePreview({
        text: text.replace(/\[take-over:\d+:[a-z]+\](?!\()/g, "a take-over link"),
    });

    if (plain.length <= AppData.SpeechMaxChars) return plain;

    return `${plain.slice(0, AppData.SpeechMaxChars).trimEnd()}…`;
}
