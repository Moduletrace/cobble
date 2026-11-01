import { useEffect, useState } from "react";
import Select from "@moduletrace/twui/form/Select";
import Link from "@moduletrace/twui/layout/Link";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { BrowserComputerDefault, BrowserInheritDefault } from "@/src/dict/browser-dict";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import type { BrowserAccessPayload } from "@/src/types";
import BrowserAvailableToggle from "./browser-available-toggle";

type Props = {
    id: string;
    /**
     * Neither: all the user's bots.
     */
    bot_id?: number;
    workspace_id?: number | null;
};

/**
 * Which of the user's own browsers apply in one scope and which is its
 * default. Loads when it mounts, so no page carries it in its props, and
 * saves each change (`window.confirm` first, since it changes what bots
 * can reach as the user).
 */
export default function BrowserDefaultPicker({ id, bot_id, workspace_id }: Props) {
    const [access, setAccess] = useState<BrowserAccessPayload>();
    const [error, setError] = useState<string>();
    /**
     * Remounts the controls after a cancelled save, so they show what's
     * saved rather than what was clicked.
     */
    const [cancels, setCancels] = useState(0);
    const scope = { bot_id, workspace_id: workspace_id || undefined };

    useEffect(() => {
        postAdminApi<BrowserAccessPayload>({ path: "browsers/browser-access", body: scope }).then((res) => {
            if (res.success && res.singleRes) setAccess(res.singleRes);
            else setError(res.msg || "Couldn't load your browsers.");
        });
    }, [bot_id, workspace_id]);

    if (error && !access) return <Span className="text-[13px] leading-[18px] text-ink-secondary">{error}</Span>;

    if (!access) return null;

    if (!access.browsers.length) {
        return (
            <Span className="text-[13px] leading-[18px] text-ink-secondary">
                You have no browsers yet. <Link href="/admin/settings/browsers">Add one in Settings</Link>.
            </Span>
        );
    }

    const save = async ({
        default_browser,
        available_ids,
    }: Pick<BrowserAccessPayload, "default_browser" | "available_ids">) => {
        if (!window.confirm("Save your browser choices here?")) {
            setCancels((prev) => prev + 1);
            return;
        }

        const res = await postAdminApi<BrowserAccessPayload>({
            path: "browsers/browser-access",
            body: { ...scope, save: true, default_browser, available_ids },
        });

        if (res.success && res.singleRes) {
            setAccess(res.singleRes);
            setError(undefined);
        } else {
            setError(res.msg || "Couldn't save that.");
        }
    };

    const is_wide = !bot_id && !workspace_id;
    const options = [
        ...(is_wide ? [] : [{ value: BrowserInheritDefault, title: "Same as all my bots" }]),
        { value: BrowserComputerDefault, title: "The computer's browser" },
        ...access.browsers.map((browser) => ({ value: String(browser.id), title: browser.name })),
    ];
    const current = String(
        is_wide && access.default_browser == BrowserInheritDefault ? BrowserComputerDefault : access.default_browser,
    );

    return (
        <Stack className="w-full gap-3! items-stretch">
            <Select
                key={`${current}-${cancels}`}
                id={`${id}-default`}
                title="Default browser"
                label="Default browser"
                showLabel
                options={options.map((option) => ({ ...option, default: option.value == current }))}
                changeHandler={(value) => {
                    const picked = String(value);

                    save({
                        default_browser: /^\d+$/.test(picked) ? Number(picked) : picked,
                        available_ids: access.available_ids,
                    });
                }}
            />
            {access.browsers.map((browser) => (
                <BrowserAvailableToggle
                    key={`${browser.id}-${cancels}`}
                    name={browser.name}
                    on={access.available_ids.includes(browser.id) || access.default_browser == browser.id}
                    onChange={(on) =>
                        save({
                            default_browser:
                                !on && access.default_browser == browser.id
                                    ? BrowserInheritDefault
                                    : access.default_browser,
                            available_ids: on
                                ? [...access.available_ids, browser.id]
                                : access.available_ids.filter((other) => other != browser.id),
                        })
                    }
                />
            ))}
            {error ? <Span className="text-[13px] leading-[18px] text-ink-secondary">{error}</Span> : null}
        </Stack>
    );
}
