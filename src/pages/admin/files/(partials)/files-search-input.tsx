import Input from "@moduletrace/twui/form/Input";

type Props = {
    value: string;
    loading?: boolean;
    onChange: (search: string) => void;
    onSubmit: (search: string) => void;
};

/**
 * Narrows the open folder by name or path. Enter runs the search; clearing
 * the field runs it again empty.
 */
export default function FilesSearchInput({ value, loading, onChange, onSubmit }: Props) {
    return (
        <Input
            placeholder="Search this folder"
            value={value}
            disabled={loading}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
                if (event.key == "Enter") onSubmit(event.currentTarget.value);
            }}
            clearInputProps={{ onClick: () => onSubmit("") }}
            wrapperWrapperProps={{ className: "w-full mt-3" }}
        />
    );
}
