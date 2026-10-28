import { expect, test } from "bun:test";
import isPlainClick from "./is-plain-click";

const click = { button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false };

test("isPlainClick takes only an unmodified left click", () => {
    expect(isPlainClick({ event: click })).toBe(true);
    expect(isPlainClick({ event: { ...click, button: 1 } })).toBe(false);
    expect(isPlainClick({ event: { ...click, metaKey: true } })).toBe(false);
    expect(isPlainClick({ event: { ...click, ctrlKey: true } })).toBe(false);
    expect(isPlainClick({ event: { ...click, shiftKey: true } })).toBe(false);
});
