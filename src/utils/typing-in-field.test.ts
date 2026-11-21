import { describe, expect, test } from "bun:test";
import typingInField from "./typing-in-field";

/** A field-shaped target, as a key press sees it. */
function field({
    tagName,
    content_editable,
}: {
    tagName: string;
    content_editable?: boolean;
}) {
    return {
        tagName,
        isContentEditable: Boolean(content_editable),
    } as unknown as EventTarget;
}

describe("typingInField", () => {
    test("inputs, text areas and selects are fields", () => {
        expect(typingInField({ target: field({ tagName: "INPUT" }) })).toBe(true);
        expect(typingInField({ target: field({ tagName: "TEXTAREA" }) })).toBe(
            true,
        );
        expect(typingInField({ target: field({ tagName: "SELECT" }) })).toBe(
            true,
        );
    });

    test("contenteditable elements are fields, whatever their tag", () => {
        expect(
            typingInField({
                target: field({ tagName: "DIV", content_editable: true }),
            }),
        ).toBe(true);
    });

    test("buttons, links and other elements are not", () => {
        expect(typingInField({ target: field({ tagName: "BUTTON" }) })).toBe(
            false,
        );
        expect(typingInField({ target: field({ tagName: "DIV" }) })).toBe(false);
    });

    test("a missing or non-element target is not a field", () => {
        expect(typingInField({ target: null })).toBe(false);
        expect(typingInField({ target: new EventTarget() })).toBe(false);
    });
});