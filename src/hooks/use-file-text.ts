import { useEffect, useState } from "react";
import { AppData } from "@/src/data/app-data";

type Params = {
    url: string;
    /**
     * Read nothing (a preview that isn't text).
     */
    skip?: boolean;
    /**
     * The file's size when known, so a big one isn't fetched at all.
     */
    size?: number;
};

type FileText = {
    text: string | null;
    loading: boolean;
    error: string | null;
    /**
     * Bigger than `AppData.FilePreviewMaxTextBytes`: offered to download only.
     */
    too_large: boolean;
};

/**
 * A file's bytes read as text for the preview, once per URL, up to
 * `AppData.FilePreviewMaxTextBytes`.
 */
export default function useFileText({ url, skip, size }: Params): FileText {
    const max = AppData.FilePreviewMaxTextBytes;
    const known_too_large = Boolean(size && size > max);
    const [state, setState] = useState<FileText>({
        text: null,
        loading: !skip && !known_too_large,
        error: null,
        too_large: known_too_large,
    });

    useEffect(() => {
        if (skip || known_too_large) return;

        let live = true;

        setState({ text: null, loading: true, error: null, too_large: false });

        (async () => {
            try {
                const res = await fetch(url, { credentials: "same-origin" });

                if (!res.ok) throw new Error(`The file couldn't be read (${res.status}).`);

                const length = Number(res.headers.get("content-length")) || 0;

                if (length > max) {
                    res.body?.cancel();
                    if (live) setState({ text: null, loading: false, error: null, too_large: true });
                    return;
                }

                const blob = await res.blob();

                if (blob.size > max) {
                    if (live) setState({ text: null, loading: false, error: null, too_large: true });
                    return;
                }

                const text = await blob.text();

                if (live) setState({ text, loading: false, error: null, too_large: false });
            } catch (error: any) {
                if (live) {
                    setState({
                        text: null,
                        loading: false,
                        error: error?.message || "The file couldn't be read.",
                        too_large: false,
                    });
                }
            }
        })();

        return () => {
            live = false;
        };
    }, [url, skip, known_too_large, max]);

    return state;
}
