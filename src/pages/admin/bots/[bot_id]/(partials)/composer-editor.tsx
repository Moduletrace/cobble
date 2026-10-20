import { EditorContent, type Editor } from "@tiptap/react";
import ComposerFormatBubble from "./composer-format-bubble";
import LoadingBlock from "@moduletrace/twui/elements/LoadingBlock";

type Props = {
    editor: Editor | null;
    invalid?: boolean;
    title?: string;
};

/**
 * The composer's input (`useComposerEditor`), with the formatting bubble
 * over a selection. It fills the row between the attach and voice
 * buttons.
 */
export default function ComposerEditor({ editor, invalid, title }: Props) {
    return (
        <>
            <EditorContent
                editor={editor}
                aria-invalid={invalid ? true : undefined}
                title={title}
                className="grow min-w-0 self-center"
            />
            {editor ? (
                <ComposerFormatBubble editor={editor} />
            ) : (
                <LoadingBlock className="w-full h-[30px] -ml-6" />
            )}
        </>
    );
}
