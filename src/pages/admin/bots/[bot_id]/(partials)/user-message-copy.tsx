import CopyMessageButton from "./copy-message-button";

type Props = {
    text: string;
};

/**
 * One message's copy button, in the row under a user group beside its
 * timestamp. A message with no text renders nothing at all.
 */
export default function UserMessageCopy({ text }: Props) {
    if (!text.trim()) return null;

    return <CopyMessageButton text={text} />;
}
