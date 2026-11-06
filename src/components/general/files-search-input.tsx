import Input from "@moduletrace/twui/form/Input";

type Props = {
    value: string;
    onChange: (search: string) => void;
};

/**
 * Narrows the open folder by name or path as the user types (the pane
 * debounces the search).
 */
export default function FilesSearchInput({ value, onChange }: Props) {
    return (
        <Input
            placeholder="Search this folder by name"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            clearInputProps={{ onClick: () => onChange("") }}
            wrapperWrapperProps={{ className: "w-full mt-3" }}
        />
    );
}
