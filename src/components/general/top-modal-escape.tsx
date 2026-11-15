import useTopModalEscape from "@/src/hooks/use-top-modal-escape";

type Props = {
    onClose: () => void;
};

/**
 * Keeps Escape on the modal on top of a stack: twui's modal closes every open
 * one, so a part opened from a task (or a task from the workspace's list)
 * would take the one below it away too. Mounted only while its modal is open,
 * it closes that one alone and the press goes no further.
 */
export default function TopModalEscape({ onClose }: Props) {
    useTopModalEscape({ onClose });

    return null;
}