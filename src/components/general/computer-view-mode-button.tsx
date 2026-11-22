import TabButton from "@/src/components/general/tab-button";

type Props = {
    title: string;
    active: boolean;
    onPick: () => void;
};

/**
 * One mode in a computer view's toolbar (`ComputerViewModes`).
 */
export default function ComputerViewModeButton({ title, active, onPick }: Props) {
    return <TabButton title={title} active={active} onPick={onPick} />;
}