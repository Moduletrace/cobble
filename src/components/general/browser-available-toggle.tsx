import Checkbox from "@moduletrace/twui/form/Checkbox";

type Props = {
    name: string;
    on: boolean;
    onChange: (on: boolean) => void;
};

/**
 * Whether bots can use one of the user's browsers in a scope. Saves on
 * `clickDispatchHandler`, since Checkbox's `changeHandler` fires on mount too.
 */
export default function BrowserAvailableToggle({ name, on, onChange }: Props) {
    return <Checkbox title={name} label={`Bots can use ${name} here`} checked={on} clickDispatchHandler={onChange} />;
}
