// Clipboard sync for noVNC (added to its vnc.html when the image is built).
// noVNC 1.6 only syncs the clipboard through its side panel. Here Ctrl+V or
// Cmd+V on the screen first hands the user's clipboard to the computer, then
// sends Ctrl+V, so it pastes what the user copied; text copied on the
// computer is put on the user's clipboard. Reading the clipboard asks the
// browser's permission once (the frame allows clipboard-read).
import UI from "./app/ui.js";

const XK_Control_L = 0xffe3;
const XK_v = 0x0076;

let swallowing_v = false;
// Whether the user still holds Ctrl when the paste goes out: reading the
// clipboard takes a moment, and noVNC may have sent Ctrl's release by then.
let ctrl_held = false;

const sendPaste = async () => {
    let text = "";

    try {
        text = await navigator.clipboard.readText();
    } catch {
        text = "";
    }

    const rfb = UI.rfb;
    if (!rfb) return;

    if (text) rfb.clipboardPasteFrom(text);

    // The computer's Chrome pastes on Ctrl+V (a Mac's Cmd is sent as Ctrl).
    // Ctrl is pressed again here, and left down if the user still holds it.
    rfb.sendKey(XK_Control_L, "ControlLeft", true);
    rfb.sendKey(XK_v, "KeyV", true);
    rfb.sendKey(XK_v, "KeyV", false);
    if (!ctrl_held) rfb.sendKey(XK_Control_L, "ControlLeft", false);
};

window.addEventListener(
    "keydown",
    (event) => {
        if (event.key == "Control") ctrl_held = true;
        if (!UI.rfb || event.code != "KeyV" || event.altKey || event.shiftKey) return;
        if (!(event.ctrlKey || event.metaKey)) return;
        if (event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLInputElement) return;

        event.preventDefault();
        event.stopImmediatePropagation();
        swallowing_v = true;
        sendPaste();
    },
    true,
);

window.addEventListener(
    "keyup",
    (event) => {
        if (event.key == "Control") ctrl_held = false;
        if (!swallowing_v || event.code != "KeyV") return;

        event.preventDefault();
        event.stopImmediatePropagation();
        swallowing_v = false;
    },
    true,
);

const watch = () => {
    if (!UI.rfb || UI.rfb.__cobble_clipboard) return;

    UI.rfb.__cobble_clipboard = true;
    UI.rfb.addEventListener("clipboard", (event) => {
        navigator.clipboard?.writeText(event.detail.text).catch(() => {});
    });
};

setInterval(watch, 500);

window.addEventListener("blur", () => {
    ctrl_held = false;
});
