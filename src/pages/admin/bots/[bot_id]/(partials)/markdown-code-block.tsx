import { isValidElement, type ReactNode } from "react";
import SunkenCodeBlock from "@/src/components/general/sunken-code-block";

/**
 * A fenced code block in a bot message, on the sunken surface with
 * twui's copy button (its icon is drawn white; recoloured to the theme).
 */
export default function MarkdownCodeBlock({ children }: { children?: ReactNode }) {
    const code = isValidElement(children)
        ? (children.props as { children?: ReactNode }).children
        : children;

    return <SunkenCodeBlock>{code}</SunkenCodeBlock>;
}