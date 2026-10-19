import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import fileInputToBase64 from "@moduletrace/twui/utils/form/fileInputToBase64";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import { AppData } from "@/src/data/app-data";
import type { UploadBotAttachmentRequest } from "@/src/schemas/bot-schema";
import type { BotMessageAttachment } from "@/src/types";

type Params = {
    file: File;
};

/**
 * Uploads one file for the next message. Files over the size limit are
 * refused here, before they're read.
 */
export default async function uploadBotAttachment({
    file,
}: Params): Promise<APIResponseObject<BotMessageAttachment>> {
    if (file.size > AppData.BotAttachmentMaxBytes) {
        return {
            success: false,
            msg: `Too big: files can be up to ${Math.round(AppData.BotAttachmentMaxBytes / 1024 / 1024)} MB.`,
        };
    }

    const { fileBase64Full } = await fileInputToBase64({ inputFile: file });

    if (!fileBase64Full) {
        return { success: false, msg: `Couldn't read the file.` };
    }

    return await fetchApi<
        UploadBotAttachmentRequest,
        APIResponseObject<BotMessageAttachment>
    >(`/api/admin/bots/upload-attachment`, {
        method: "POST",
        body: { data_url: fileBase64Full, name: file.name || "file" },
    });
}
