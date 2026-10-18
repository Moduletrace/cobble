export default async function bufferFromBase64(
    base_64: string,
): Promise<{ buffer: Buffer; ext: string }> {
    let mimeType = "";
    let data = base_64;

    const dataUrlMatch = base_64.match(
        /^data:([^;]+);base64,([\s\S]+)$/i,
    );

    if (dataUrlMatch?.[1] && dataUrlMatch[2]) {
        mimeType = dataUrlMatch[1].trim().toLowerCase();
        data = dataUrlMatch[2];
    }

    const buffer = Buffer.from(data, "base64");

    let ext = "bin";
    if (mimeType.includes("image/jpeg") || mimeType.includes("image/jpg"))
        ext = "jpeg";
    else if (mimeType.includes("image/png")) ext = "png";
    else if (mimeType.includes("image/webp")) ext = "webp";
    else if (mimeType.includes("image/gif")) ext = "gif";
    else if (mimeType.includes("image/svg")) ext = "svg";
    else if (mimeType.includes("application/pdf")) ext = "pdf";
    else if (
        mimeType.includes(
            "application/vnd.openxmlformats-officedocument.wordprocessingml",
        )
    )
        ext = "docx";
    else if (
        mimeType.includes(
            "application/vnd.openxmlformats-officedocument.spreadsheetml",
        )
    )
        ext = "xlsx";
    else if (mimeType.includes("text/csv")) ext = "csv";
    else if (mimeType.includes("text/markdown")) ext = "md";
    else if (mimeType.includes("text/plain")) ext = "txt";
    else if (mimeType.includes("/")) {
        ext = mimeType.split("/").pop()?.split("+")[0] || "bin";
    }

    return { buffer, ext };
}
