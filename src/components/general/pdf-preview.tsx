import Loading from "@moduletrace/twui/elements/Loading";
import Center from "@moduletrace/twui/layout/Center";
import Span from "@moduletrace/twui/layout/Span";
import { useEffect, useState } from "react";

type Props = {
    url: string;
    body: any;
    download_name?: string;
    height?: number;
};

export default function PdfPreview({
    url,
    body,
    download_name,
    height = 1200,
}: Props) {
    const [blob_url, setBlobUrl] = useState<string>();
    const [error, setError] = useState<string>();

    useEffect(() => {
        let object_url: string | undefined;
        let cancelled = false;

        setBlobUrl(undefined);
        setError(undefined);

        (async () => {
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
                    throw new Error(json.msg || "Couldn't generate PDF");
                }

                if (!res.ok) {
                    throw new Error(`Request failed with status ${res.status}`);
                }

                const blob = await res.blob();

                if (cancelled) return;

                object_url = URL.createObjectURL(blob);
                setBlobUrl(object_url);
            } catch (error: any) {
                if (!cancelled) {
                    setError(error.message || "Couldn't generate PDF preview");
                }
            }
        })();

        return () => {
            cancelled = true;

            if (object_url) {
                URL.revokeObjectURL(object_url);
            }
        };
    }, [url]);

    if (error) {
        return (
            <Center className="py-10">
                <Span className="text-warning">{error}</Span>
            </Center>
        );
    }

    if (!blob_url) {
        return (
            <Center className="py-10">
                <Loading />
            </Center>
        );
    }

    return (
        <div className="w-full flex flex-col gap-2 items-end">
            {download_name ? (
                <a
                    href={blob_url}
                    download={download_name}
                    className="text-sm text-link-500 hover:opacity-70 underline"
                >
                    Download PDF
                </a>
            ) : null}
            <iframe
                src={blob_url}
                title="PDF Preview"
                className="w-full rounded-default border border-slate-300 dark:border-white/20 bg-white"
                style={{ height }}
            />
        </div>
    );
}
