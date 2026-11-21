type Params = {
    text: string;
};

export type PlanModeFileEscape = "missing_tool" | "save_it_yourself";

/**
 * The claim that the app has no way to write a file, or the request that the
 * user save it, in a reply sent with Plan mode on. The tool exists and Plan
 * mode is the only thing that stops it, so the answer should have asked to
 * save instead of handing over the document. 969 in session 133 said "Since
 * I don't have a write_file tool available in this environment, here's the
 * complete document for you to save" and pasted the whole roadmap.
 */
const MissingWriteTool =
    /\b(?:don'?t|do not|doesn'?t|didn'?t)\s+(?:have|get|see)\b[^.!?\n]{0,40}\b(?:write_file|write tools?|file[- ]writing tools?)\b/i;

const WriteToolUnavailable =
    /\b(?:write_file|write tools?)\b[^.!?\n]{0,30}\b(?:not available|isn'?t available|unavailable|no such tool)\b/i;

const SaveItYourself =
    /\b(?:for you to save|save (?:it|this|the (?:document|file|report)) yourself|you(?:'ll| will)? (?:need|have) to save (?:it|this|the (?:document|file|report))|copy (?:it|this) into (?:a|your) (?:file|document|doc))\b/i;

/**
 * What in a Plan mode answer gives the write back to the user instead of
 * asking to leave the mode: a made-up missing tool, or an instruction to
 * save the document themselves. Null when the answer asks, or when it only
 * says Plan mode stops it and offers to save.
 */
export default function planModeFileEscape({ text }: Params): PlanModeFileEscape | null {
    if (MissingWriteTool.test(text) || WriteToolUnavailable.test(text)) return "missing_tool";

    if (SaveItYourself.test(text)) return "save_it_yourself";

    return null;
}