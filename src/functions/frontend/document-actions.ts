/**
 * # Client-side actions for document/invoice generation & emailing.
 * PDF endpoints return binary PDFs (not JSON), so plain fetch is used
 * here instead of `fetchApi`.
 */

async function postAdminAction({
    url,
    body,
}: {
    url: string;
    body: any;
}): Promise<{ success: boolean; msg?: string }> {
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body || {}),
        });

        const content_type = res.headers.get("Content-Type") || "";

        if (content_type.includes("application/json")) {
            const json = await res.json();
            return {
                success: Boolean(json.success),
                msg: json.msg,
            };
        }

        if (!res.ok) {
            throw new Error(`Request failed with status ${res.status}`);
        }

        return {
            success: true,
        };
    } catch (error: any) {
        return {
            success: false,
            msg: error.message || "Request failed",
        };
    }
}

export async function downloadGeneratedPdf({
    url,
    body,
    fallback_filename,
}: {
    url: string;
    body: any;
    fallback_filename?: string;
}): Promise<{ success: boolean; msg?: string }> {
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body || {}),
        });

        const content_type = res.headers.get("Content-Type") || "";

        if (content_type.includes("application/json")) {
            const json = await res.json();
            return {
                success: Boolean(json.success),
                msg: json.msg,
            };
        }

        if (!res.ok) {
            throw new Error(`Request failed with status ${res.status}`);
        }

        const blob = await res.blob();

        if (blob.size == 0) {
            throw new Error(`Received an empty PDF`);
        }

        const disposition = res.headers.get("Content-Disposition") || "";
        const filename_match = disposition.match(/filename="?([^";]+)"?/i);
        const filename =
            filename_match?.[1] || fallback_filename || "document.pdf";

        const object_url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");

        anchor.href = object_url;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);

        setTimeout(() => {
            URL.revokeObjectURL(object_url);
        }, 1000);

        return { success: true };
    } catch (error: any) {
        return {
            success: false,
            msg: error.message || "Couldn't download document",
        };
    }
}

export async function sendEmailRecord({
    url,
    body,
}: {
    url: string;
    body: any;
}) {
    return await postAdminAction({ url, body });
}