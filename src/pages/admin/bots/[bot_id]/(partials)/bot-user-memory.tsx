import Span from "@moduletrace/twui/layout/Span";
import CodeEditor from "@/src/components/general/code-editor";

type Props = {
    bot_name: string;
    /**
     * What the bot has saved about the user reading the panel; empty until
     * it saved anything.
     */
    memory: string;
};

/**
 * What the bot remembers about this user alone (`bot_user_memories`), shown
 * in its panel's settings tab. It shapes how the bot works with them, never
 * what it does, and only the bot writes it.
 */
export default function BotUserMemory({ bot_name, memory }: Props) {
    return (
        <>
            <Span className="text-[13px] leading-[18px] text-ink-secondary">
                {`What ${bot_name} remembers about you, which only shapes how it works with you.`}
            </Span>
            <CodeEditor
                title="About you"
                content={memory || "Nothing yet."}
                mode="markdown"
                className="h-32"
                readOnly
                onChange={() => {}}
            />
        </>
    );
}