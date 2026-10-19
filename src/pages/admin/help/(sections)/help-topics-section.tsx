import { HelpTopics } from "../(data)/help-topics";
import HelpTopicGroup from "../(partials)/help-topic-group";

/**
 * Every help topic, one block each.
 */
export default function HelpTopicsSection() {
    return (
        <>
            {HelpTopics.map((topic) => (
                <HelpTopicGroup key={topic.id} {...topic} />
            ))}
        </>
    );
}
