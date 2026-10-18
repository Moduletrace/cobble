import Button from "@moduletrace/twui/layout/Button";
import type { LogCategoryFilter } from "../(data)/log-category-filters";
import type { LogCategoryValue } from "../(data)/log-category-styles";

type Props = LogCategoryFilter & {
    active?: boolean;
    selectCategory: (params: { value?: LogCategoryValue }) => void;
};

export default function LogCategoryFilterButton({
    title,
    value,
    active,
    selectCategory,
}: Props) {
    return (
        <Button
            title={`Show ${title} Logs`}
            size="small"
            variant={active ? "normal" : "outlined"}
            color={active ? "primary" : "gray"}
            onClick={() => {
                selectCategory({ value });
            }}
        >
            {title}
        </Button>
    );
}
