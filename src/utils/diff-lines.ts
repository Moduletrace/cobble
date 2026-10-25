type Params = {
    before: string;
    after: string;
    /**
     * Lines of unchanged context kept around each change.
     */
    context?: number;
};

const MaxLines = 2000;

/**
 * A line diff of two texts as `+ added`, `- removed` and `  kept` lines,
 * unchanged runs cut down to `context` lines around each change (a `...`
 * line marks a cut), so one line added to a long runbook stands out.
 * Texts past `MaxLines` lines are compared whole, as one removal and one
 * addition. Empty when they're the same.
 */
export default function diffLines({ before, after, context = 2 }: Params) {
    if (before == after) return "";

    const a = before.split("\n");
    const b = after.split("\n");

    if (a.length > MaxLines || b.length > MaxLines) {
        return [...a.map((line) => `- ${line}`), ...b.map((line) => `+ ${line}`)].join("\n");
    }

    const lcs: number[][] = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));

    for (let i = a.length - 1; i >= 0; i--) {
        for (let j = b.length - 1; j >= 0; j--) {
            lcs[i]![j] = a[i] == b[j] ? lcs[i + 1]![j + 1]! + 1 : Math.max(lcs[i + 1]![j]!, lcs[i]![j + 1]!);
        }
    }

    const lines: { mark: " " | "+" | "-"; text: string }[] = [];
    let i = 0;
    let j = 0;

    while (i < a.length || j < b.length) {
        if (i < a.length && j < b.length && a[i] == b[j]) {
            lines.push({ mark: " ", text: a[i]! });
            i++;
            j++;
        } else if (i < a.length && (j >= b.length || lcs[i + 1]![j]! >= lcs[i]![j + 1]!)) {
            lines.push({ mark: "-", text: a[i]! });
            i++;
        } else {
            lines.push({ mark: "+", text: b[j]! });
            j++;
        }
    }

    const near = lines.map((_, index) =>
        lines.slice(Math.max(0, index - context), index + context + 1).some((line) => line.mark != " "),
    );
    const out: string[] = [];

    lines.forEach((line, index) => {
        if (near[index]) out.push(`${line.mark} ${line.text}`);
        else if (out.at(-1) != "...") out.push("...");
    });

    return out.join("\n");
}
