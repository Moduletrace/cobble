export type FileToDataUrlResult = {
    dataUrl?: string;
    file?: File;
    mimeType?: string;
    name?: string;
};

export default async function fileToDataUrl({
    file,
}: {
    file: File;
}): Promise<FileToDataUrlResult> {
    try {
        const reader = new FileReader();

        const dataUrl = await new Promise<string>((res, rej) => {
            reader.onload = () => {
                res(reader.result as string);
            };
            reader.onerror = () => {
                rej(new Error(`Couldn't read file: ${file.name}`));
            };
            reader.readAsDataURL(file);
        });

        return {
            dataUrl,
            file,
            mimeType: file.type,
            name: file.name,
        };
    } catch (error: any) {
        console.log(`File To Data URL Error! => ${error.message}`);

        return {};
    }
}