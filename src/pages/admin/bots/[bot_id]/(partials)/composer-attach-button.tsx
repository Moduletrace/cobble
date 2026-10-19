import Button from "@moduletrace/twui/layout/Button";
import { Plus } from "lucide-react";
import { AppData } from "@/src/data/app-data";
import pickFiles from "../(utils)/pick-files";

type Props = {
    disabled?: boolean;
    onFiles: (params: { files: File[] }) => void;
};

/**
 * Opens the file picker for the next message's attachments.
 */
export default function ComposerAttachButton({ disabled, onFiles }: Props) {
    return (
        <Button
            title={
                disabled
                    ? `Up to ${AppData.BotAttachmentMaxFiles} files per message`
                    : "Attach files"
            }
            type="button"
            variant="ghost"
            color="text"
            disabled={disabled}
            onClick={() => pickFiles({ onFiles })}
            className="shrink-0 p-1! -mx-1 my-1 text-ink dark:text-ink rounded-default-xs focus-visible:ring-2 focus-visible:ring-ink"
        >
            <Plus size={16} aria-hidden />
        </Button>
    );
}
