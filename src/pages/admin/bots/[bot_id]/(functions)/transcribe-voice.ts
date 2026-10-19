import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import fileInputToBase64 from "@moduletrace/twui/utils/form/fileInputToBase64";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import type { TranscribeVoiceRequest } from "@/src/schemas/bot-schema";

type Params = {
    bot_id: number;
    workspace_id?: number | null;
    audio: Blob;
};

/**
 * Sends a composer dictation to be turned into text with the bot's
 * transcription model.
 */
export default async function transcribeVoice({
    bot_id,
    workspace_id,
    audio,
}: Params): Promise<APIResponseObject<{ text: string }>> {
    const ext = audio.type.split("/").pop() || "webm";
    const { fileBase64Full } = await fileInputToBase64({
        inputFile: new File([audio], `dictation.${ext}`, { type: audio.type }),
    });

    if (!fileBase64Full) {
        return { success: false, msg: `Couldn't read the recording.` };
    }

    return await fetchApi<
        TranscribeVoiceRequest,
        APIResponseObject<{ text: string }>
    >(`/api/admin/bots/transcribe`, {
        method: "POST",
        body: { bot_id, workspace_id, data_url: fileBase64Full },
    });
}
