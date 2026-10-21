import type { BotFileScope } from "@/src/dict/bot-file-dict";
import AppError from "@/src/utils/app-error";
import grabBotFileQuotaBytes from "./grab-bot-file-quota-bytes";
import grabStorageUsage from "./grab-storage-usage";

type Params = {
    scope: BotFileScope;
    owner_id: number | string;
    /**
     * How many bytes are about to be added. A rewrite of an existing file
     * passes only the growth.
     */
    incoming_bytes: number;
};

/**
 * Refuses a write that would push a directory past its quota, naming the
 * limit and the current usage so the bot can clear space first.
 */
export default async function assertStorageRoom({
    scope,
    owner_id,
    incoming_bytes,
}: Params) {
    const quota = await grabBotFileQuotaBytes();

    if (incoming_bytes <= 0) return;

    const usage = await grabStorageUsage({ scope, owner_id });

    if (usage.bytes + incoming_bytes <= quota) return;

    throw new AppError(
        `No room left: ${formatMb({ bytes: usage.bytes })} of ${formatMb({ bytes: quota })} used in ${scope == "workspace" ? "this workspace" : "your files"}. Delete or move something first.`,
    );
}

/**
 * A size in MB, for messages: "12.4 MB".
 */
export function formatMb({ bytes }: { bytes: number }) {
    const mb = bytes / (1024 * 1024);

    if (mb >= 10) return `${Math.round(mb)} MB`;

    return `${mb.toFixed(1)} MB`;
}
