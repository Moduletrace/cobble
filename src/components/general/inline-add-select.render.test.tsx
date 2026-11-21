import { expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import InlineAddSelect from "./inline-add-select";

test("the add picker is a search field listing every option", () => {
    const html = renderToString(
        <InlineAddSelect
            id="add-bot"
            noun="bot"
            options={[
                { value: "1", title: "Alpha" },
                { value: "2", title: "Beta" },
            ]}
            onAdd={() => {}}
        />,
    );

    expect(html).toContain("Pick a bot…");
    expect(html).toContain('<option value="1">Alpha</option>');
    expect(html).toContain('<option value="2">Beta</option>');
    expect(html).toContain("Add the bot");
    expect(html).toContain("disabled");
});

test("nothing left to add renders no picker", () => {
    const html = renderToString(<InlineAddSelect id="add-bot" noun="bot" options={[]} onAdd={() => {}} />);

    expect(html).toBe("");
});