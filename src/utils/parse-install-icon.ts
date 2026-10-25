import { BotHues, type BotHue } from "@/src/dict/bot-dict";
import {
    PwaDefaultInstallIcon,
    PwaInstallIconModes,
    type PwaInstallIcon,
} from "@/src/data/pwa-data";

type Params = {
    /**
     * The `install_icon` app setting, as saved.
     */
    saved?: string | null;
};

/**
 * The install's icon from its saved JSON, field by field: anything missing
 * or unknown falls back to the stock ember icon's value.
 */
export default function parseInstallIcon({ saved }: Params): PwaInstallIcon {
    let raw: Record<string, unknown> = {};

    try {
        const parsed = saved ? JSON.parse(saved) : null;
        if (parsed && typeof parsed == "object") raw = parsed;
    } catch {
        raw = {};
    }

    const mode = PwaInstallIconModes.find((value) => value == raw.mode);
    const stone = BotHues.find((hue) => hue.value == raw.stone)?.value as BotHue | undefined;
    const version =
        typeof raw.version == "string" && /^[a-f0-9]{12}$/.test(raw.version) ? raw.version : null;

    return {
        mode: mode || PwaDefaultInstallIcon.mode,
        stone: stone || PwaDefaultInstallIcon.stone,
        mark: typeof raw.mark == "boolean" ? raw.mark : PwaDefaultInstallIcon.mark,
        version,
    };
}
