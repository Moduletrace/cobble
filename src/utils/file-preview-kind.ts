/**
 * How the file preview shows a file.
 */
export type FilePreviewKind =
    | "markdown"
    | "csv"
    | "tsv"
    | "image"
    | "pdf"
    | "html"
    | "audio"
    | "video"
    | "text"
    | "none";

type Params = {
    name?: string | null;
    /**
     * The `media` type (`image`, `video`, `document`, `audio`), when known.
     */
    media_type?: string | null;
};

const ExtensionKinds: Record<string, FilePreviewKind> = {
    md: "markdown",
    markdown: "markdown",
    mdx: "markdown",
    csv: "csv",
    tsv: "tsv",
    tab: "tsv",
    png: "image",
    jpg: "image",
    jpeg: "image",
    gif: "image",
    webp: "image",
    avif: "image",
    bmp: "image",
    ico: "image",
    svg: "image",
    pdf: "pdf",
    html: "html",
    htm: "html",
    mp3: "audio",
    wav: "audio",
    ogg: "audio",
    oga: "audio",
    m4a: "audio",
    flac: "audio",
    aac: "audio",
    opus: "audio",
    mp4: "video",
    webm: "video",
    mov: "video",
    m4v: "video",
    ogv: "video",
};

/**
 * Text read as it is (shown as code, never run: XML sources too).
 */
const TextExtensions = [
    "txt",
    "text",
    "log",
    "out",
    "json",
    "jsonl",
    "ndjson",
    "yaml",
    "yml",
    "toml",
    "ini",
    "cfg",
    "conf",
    "env",
    "xml",
    "css",
    "scss",
    "js",
    "mjs",
    "cjs",
    "ts",
    "tsx",
    "jsx",
    "py",
    "rb",
    "php",
    "go",
    "rs",
    "java",
    "kt",
    "swift",
    "c",
    "h",
    "cpp",
    "hpp",
    "cs",
    "sh",
    "bash",
    "zsh",
    "sql",
    "diff",
    "patch",
    "rst",
    "tex",
    "ics",
    "vtt",
    "srt",
];

/**
 * Files often named without an extension that hold text.
 */
const TextNames = ["readme", "license", "makefile", "dockerfile", "changelog", "notes"];

/**
 * What the file preview does with a file, from its name first (a bot's
 * `report.md` is a document to `media`) and its media type after.
 */
export default function filePreviewKind({ name, media_type }: Params): FilePreviewKind {
    const base = (name || "").trim().toLowerCase().split("/").pop() || "";
    const dot = base.lastIndexOf(".");
    const extension = dot > 0 ? base.slice(dot + 1) : "";

    if (extension && ExtensionKinds[extension]) return ExtensionKinds[extension]!;
    if (extension && TextExtensions.includes(extension)) return "text";
    if (!extension && TextNames.includes(base)) return "text";

    if (media_type == "image") return "image";
    if (media_type == "audio") return "audio";
    if (media_type == "video") return "video";

    return "none";
}
