import type { Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import Row from "@moduletrace/twui/layout/Row";
import ComposerFormatButton from "./composer-format-button";
import { ComposerFormats } from "../(data)/composer-formats";

type Props = {
    editor: Editor;
};

/**
 * Formatting for the selected text, floating over it: bold, italic,
 * strike, code, link, quote and lists. The same marks have their usual
 * shortcuts (Mod+B, Mod+I, ...) and markdown typing (`**`, `- `, `> `).
 */
export default function ComposerFormatBubble({ editor }: Props) {
    return (
        <BubbleMenu
            editor={editor}
            shouldShow={({ editor, from, to }) =>
                from != to && !editor.isActive("codeBlock") && !editor.isActive("mention")
            }
        >
            <Row className="gap-0.5! flex-nowrap items-center p-1 rounded-default border border-solid border-hairline bg-surface shadow-popover">
                {ComposerFormats.map((format) => (
                    <ComposerFormatButton
                        key={format.name}
                        title={format.title}
                        active={editor.isActive(format.name)}
                        onClick={() => format.toggle({ editor })}
                    >
                        <format.Icon size={15} aria-hidden />
                    </ComposerFormatButton>
                ))}
            </Row>
        </BubbleMenu>
    );
}
