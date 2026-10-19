type Params = {
    onFiles: (params: { files: File[] }) => void;
};

/**
 * Opens the browser's file picker (several files allowed). The input is
 * made on the spot rather than rendered: twui's `Input` writes its value
 * back into the element, which a file input refuses.
 */
export default function pickFiles({ onFiles }: Params) {
    const input = document.createElement("input");

    input.type = "file";
    input.multiple = true;
    input.addEventListener("change", () => {
        const files = [...(input.files || [])];

        if (files.length) onFiles({ files });
    });
    input.click();
}
