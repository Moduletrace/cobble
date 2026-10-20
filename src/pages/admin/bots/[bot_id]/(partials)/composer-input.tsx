import { useEffect, type RefObject } from "react";
import type { Editor } from "@tiptap/react";
import useComposerEditor, { type ComposerMentionMenu } from "../(hooks)/use-composer-editor";
import ComposerEditor from "./composer-editor";

export type ComposerInputApi = ReturnType<typeof useComposerEditor>;

type Props = Parameters<typeof useComposerEditor>[0] & {
    /**
     * Gets the editor's commands (`setMarkdown`, `clear`, `insertText`,
     * `insertQuote`) for the composer around it.
     */
    api_ref: RefObject<ComposerInputApi | null>;
    onEditor: (editor: Editor | null) => void;
    onMenu: (menu: ComposerMentionMenu | null) => void;
    invalid?: boolean;
    title?: string;
};

/**
 * The composer's Tiptap editor, loaded on its own after the page (the
 * composer imports it lazily: Tiptap is the heaviest code on the page).
 * Hands its editor, mention menu and commands up to the composer.
 */
export default function ComposerInput({ api_ref, onEditor, onMenu, invalid, title, ...params }: Props) {
    const input = useComposerEditor(params);

    api_ref.current = input;

    useEffect(() => {
        onEditor(input.editor);
    }, [input.editor]);

    useEffect(() => {
        onMenu(input.menu);
    }, [input.menu]);

    useEffect(() => () => {
        api_ref.current = null;
    }, []);

    return <ComposerEditor editor={input.editor} invalid={invalid} title={title} />;
}
