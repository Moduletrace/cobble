import CodeEditor from "@/src/components/general/code-editor";

type BotReadOnlyBlockProps = {
    title: string;
    content: string;
    className?: string;
};

/** A block of a bot's own text its panel shows a user read-only. */
export default function BotReadOnlyBlock({
    title,
    content,
    className,
}: BotReadOnlyBlockProps) {
    return (
        <CodeEditor
            title={title}
            content={content || "Nothing yet."}
            mode="markdown"
            className={className}
            readOnly
            onChange={() => {}}
        />
    );
}