import { describe, expect, test } from "bun:test";
import matchesNotificationFilter from "./matches-notification-filter";

const payload = JSON.stringify({ origin: "mail.google.com", title: "New email from Ana", body: "Invoice due", app: "Chromium" });

describe("matchesNotificationFilter", () => {
    test("no filter takes every notification", () => {
        expect(matchesNotificationFilter({ payload })).toBe(true);
        expect(matchesNotificationFilter({ payload, filter: " , " })).toBe(true);
    });

    test("matches the site, title or text, in any case, any of several words", () => {
        expect(matchesNotificationFilter({ payload, filter: "MAIL.GOOGLE.COM" })).toBe(true);
        expect(matchesNotificationFilter({ payload, filter: "slack.com, invoice" })).toBe(true);
        expect(matchesNotificationFilter({ payload, filter: "slack.com" })).toBe(false);
    });

    test("searches a payload that isn't JSON as text", () => {
        expect(matchesNotificationFilter({ payload: "plain alert", filter: "alert" })).toBe(true);
    });
});
