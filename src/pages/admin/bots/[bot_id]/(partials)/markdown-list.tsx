import { Children, isValidElement, type ReactNode } from "react";
import List from "@moduletrace/twui/layout/List";

type Props = {
    children?: ReactNode;
    ordered?: boolean;
    start?: number;
};

/**
 * A list in a bot message, through twui's `List` (which takes items, not
 * `li` children): each item's content is lifted out of its `li`.
 */
export default function MarkdownList({ children, ordered, start }: Props) {
    const items = Children.toArray(children)
        .filter(isValidElement)
        .map((item) => ({
            content: (item.props as { children?: ReactNode }).children,
        }));

    return (
        <List
            ordered={ordered}
            start={start}
            items={items}
            className={`w-full gap-1! pl-5 my-0 text-sm leading-5 text-ink ${ordered ? "list-decimal" : "list-disc"}`}
        />
    );
}
