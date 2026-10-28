import { expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import { AppData } from "@/src/data/app-data";
import FilePreviewBody from "./file-preview-body";
import FilePreviewLink from "./file-preview-link";
import FilePreviewMarkdown from "./file-preview-markdown";
import FilePreviewTable from "./file-preview-table";

test("a markdown file renders as a document, raw HTML left out", () => {
    const html = renderToString(
        <FilePreviewMarkdown text={"# Report\n\nSome **bold** text.\n\n| a | b |\n| - | - |\n| 1 | 2 |\n\n<script>alert(1)</script>"} />,
    );

    expect(html).toContain("Report");
    expect(html).toContain("<h2");
    expect(html).toContain("font-bold");
    expect(html).toContain("<table");
    expect(html).not.toContain("<script");
});

test("a CSV renders as a table with its header row", () => {
    const html = renderToString(<FilePreviewTable text={'name,city\n"Smith, J",Lagos\n'} delimiter="," />);

    expect(html).toContain("<thead");
    expect(html).toContain("<th");
    expect(html).toContain("Smith, J");
    expect(html).toContain("1 row");
});

test("a long CSV says it was cut", () => {
    const rows = Array.from({ length: AppData.FilePreviewMaxTableRows + 5 }, (_, i) => `${i}`).join("\n");
    const html = renderToString(<FilePreviewTable text={`n\n${rows}`} delimiter="," />);

    expect(html).toContain(`Showing the first ${AppData.FilePreviewMaxTableRows} rows`);
});

test("media previews load from the file's URL, unknown files offer a download", () => {
    expect(renderToString(<FilePreviewBody kind="image" name="a.png" url="/media/1" />)).toContain('src="/media/1"');
    expect(renderToString(<FilePreviewBody kind="pdf" name="a.pdf" url="/media/2" />)).toContain("<iframe");
    expect(renderToString(<FilePreviewBody kind="html" name="a.html" url="/media/4" />)).toContain('sandbox=""');
    expect(renderToString(<FilePreviewBody kind="none" name="a.zip" url="/media/3" />)).toContain("can&#x27;t be previewed");
});

test("a file link stays a real link to the bytes until clicked", () => {
    const html = renderToString(
        <FilePreviewLink name="report.md" url="/media/9">
            report.md
        </FilePreviewLink>,
    );

    expect(html).toContain('href="/media/9"');
    expect(html).toContain("Preview report.md");
});
