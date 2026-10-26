type Params = {
    file: File;
};

/**
 * A picked file as a data URL, for an upload. Empty when the browser can't
 * read it.
 */
export default async function readFileDataUrl({ file }: Params) {
    return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    }).catch(() => "");
}
