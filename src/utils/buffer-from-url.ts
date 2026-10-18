export default async function bufferFromUrl(
    url: string,
): Promise<{ buffer: Buffer; ext: string }> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);

    const contentType = res.headers.get("content-type") ?? "";
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Derive ext from content-type first, fall back to URL path
    let ext = "txt";
    if (contentType.includes("application/pdf")) ext = "pdf";
    else if (
        contentType.includes(
            "application/vnd.openxmlformats-officedocument.wordprocessingml",
        )
    )
        ext = "docx";
    else if (
        contentType.includes(
            "application/vnd.openxmlformats-officedocument.spreadsheetml",
        )
    )
        ext = "xlsx";
    else if (contentType.includes("text/csv")) ext = "csv";
    else if (contentType.includes("text/markdown")) ext = "md";
    else {
        const urlPath = new URL(url).pathname;
        ext = urlPath.split(".").pop()?.toLowerCase() ?? "txt";
    }

    return { buffer, ext };
}
