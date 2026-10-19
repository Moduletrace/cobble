import { useLayoutEffect, type RefObject } from "react";

type Params = {
    ref: RefObject<HTMLTextAreaElement | null>;
    value: string;
};

/**
 * Grows a textarea with its text where `field-sizing: content` isn't
 * supported (Firefox). Its CSS `max-height` still caps it, then it scrolls.
 * Does nothing where the CSS handles it.
 */
export default function useAutoGrowTextarea({ ref, value }: Params) {
    useLayoutEffect(() => {
        const el = ref.current;

        if (!el || CSS.supports("field-sizing", "content")) return;

        el.style.height = "auto";
        el.style.height = `${el.scrollHeight}px`;
    }, [ref, value]);
}
