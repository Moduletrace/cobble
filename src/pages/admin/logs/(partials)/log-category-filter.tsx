import Row from "@moduletrace/twui/layout/Row";
import { LogCategoryFilters } from "../(data)/log-category-filters";
import type { LogCategoryValue } from "../(data)/log-category-styles";
import LogCategoryFilterButton from "./log-category-filter-button";

type Props = {
    category?: LogCategoryValue;
    selectCategory: (params: { value?: LogCategoryValue }) => void;
};

export default function LogCategoryFilter({ category, selectCategory }: Props) {
    return (
        <Row className="gap-2! flex-wrap">
            {LogCategoryFilters.map((filter) => (
                <LogCategoryFilterButton
                    {...filter}
                    active={filter.value == category}
                    selectCategory={selectCategory}
                    key={filter.title}
                />
            ))}
        </Row>
    );
}
