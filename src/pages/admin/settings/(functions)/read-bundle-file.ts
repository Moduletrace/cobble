import { AppData } from "@/src/data/app-data";
import { ExtensionBundleSchema } from "@/src/schemas/extension-bundle-schema";
import type { ExtensionBundle } from "@/src/types";

type Params = {
    file: File;
};

type Result = {
    bundle?: ExtensionBundle;
    problem?: string;
};

/**
 * A bundle file as the modal reads it: JSON of this format, no bigger than
 * a paste of every extension could be, with the shape checked here so a
 * preview is never asked to read a file that isn't one.
 */
export default async function readBundleFile({ file }: Params): Promise<Result> {
    if (file.size > AppData.ExtensionBundleMaxBytes) {
        return { problem: `That file is over ${Math.round(AppData.ExtensionBundleMaxBytes / 1_000_000)} MB.` };
    }

    let value: unknown;

    try {
        value = JSON.parse(await file.text());
    } catch {
        return { problem: "That file isn't JSON." };
    }

    const parsed = ExtensionBundleSchema.safeParse(value);

    if (!parsed.success) {
        return {
            problem: `That isn't a bundle this app exports: ${parsed.error.issues[0]?.message || "unexpected shape"}.`,
        };
    }

    return { bundle: parsed.data as ExtensionBundle };
}