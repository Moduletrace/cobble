import { expect, test } from "bun:test";
import connectorAccountGoneMessage from "./connector-account-gone";

test("names the account, the provider and where to reconnect", () => {
    const message = connectorAccountGoneMessage({
        connector_name: "Gmail",
        label: "Benoti Sanchez Gmail",
        provider_title: "Composio",
    });

    expect(message).toContain('The Gmail account "Benoti Sanchez Gmail"');
    expect(message).toContain("no longer exists at Composio");
    expect(message).toContain("Settings > Connectors");
});