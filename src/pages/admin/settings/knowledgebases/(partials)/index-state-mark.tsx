import { twMerge } from "tailwind-merge";
import type { KnowledgebaseIndexState } from "@/src/utils/knowledgebase-index-state";
import { IndexStateMarks } from "../(data)/index-state-marks";

type Props = {
    state: KnowledgebaseIndexState;
    /**
     * Said on hover instead of the state's own words.
     */
    label?: string;
};

/**
 * A spinner, check or warning beside a knowledgebase or document's name:
 * how far it's indexed (`knowledgebaseIndexState`).
 */
export default function IndexStateMark({ state, label }: Props) {
    if (state == "empty") return null;

    const { Icon, label: own, className } = IndexStateMarks[state];
    const text = label || own;

    return (
        <Icon size={15} role="img" aria-label={text} className={twMerge("shrink-0 inline-block align-middle", ...className)}>
            <title>{text}</title>
        </Icon>
    );
}
