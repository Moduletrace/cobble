import { useEffect, useRef } from "react";
import AceEditor from "@moduletrace/twui/editors/AceEditor";
import type AceEditorModes from "@moduletrace/twui/editors/ace-editor-modes";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { twMerge } from "tailwind-merge";
import loadAceScripts from "@/src/utils/load-ace-scripts";

type Props = {
    title: string;
    /**
     * The starting text. Changes come back through `onChange`.
     */
    content?: string;
    mode: (typeof AceEditorModes)[number];
    placeholder?: string;
    /**
     * One line under it, like a field's info.
     */
    info?: string;
    /**
     * Its height, e.g. `h-24`.
     */
    className?: string;
    onChange: (value: string) => void;
};

/**
 * A code field: twui's `AceEditor` with its label, and a line of info
 * under it. Loads the editor's scripts when it first shows
 * (`loadAceScripts`).
 */
export default function CodeEditor({ title, content, mode, placeholder, info, className, onChange }: Props) {
    /**
     * The editor keeps the handler it was created with; this keeps it
     * calling the latest one.
     */
    const change = useRef(onChange);
    change.current = onChange;

    useEffect(() => {
        loadAceScripts().catch(() => {});
    }, []);

    return (
        <Stack className="w-full gap-1.5! items-stretch">
            <AceEditor
                title={title}
                showLabel
                content={content}
                mode={mode}
                placeholder={placeholder}
                fontSize="13px"
                delay={0}
                wrapperProps={{ className: twMerge("h-40", className) }}
                onChange={(value) => change.current(value)}
            />
            {info ? <Span className="text-[13px] leading-[18px] text-ink-secondary">{info}</Span> : null}
        </Stack>
    );
}
