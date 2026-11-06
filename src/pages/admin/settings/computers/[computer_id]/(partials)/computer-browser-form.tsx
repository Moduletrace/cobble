import { useState } from "react";
import Form from "@moduletrace/twui/form/Form";
import Input from "@moduletrace/twui/form/Input";
import Select from "@moduletrace/twui/form/Select";
import Checkbox from "@moduletrace/twui/form/Checkbox";
import Row from "@moduletrace/twui/layout/Row";
import { ComputerBrowserScales, ComputerDefaultBrowserScale, ComputerScreenSizes } from "@/src/dict/computer-dict";
import AddFormActions from "@/src/layouts/bots/(partials)/add-form-actions";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import type { ComputerWithStatus } from "@/src/types";
import parseComputerBrowserSettings from "@/src/utils/parse-computer-browser-settings";

type Props = {
    computer: ComputerWithStatus;
    /**
     * Gets the saved computer and the server's note.
     */
    onUpdated: (params: { computer: ComputerWithStatus; msg: string }) => void;
};

/**
 * A computer's browser settings (`ComputerBrowserSettingsSchema`): its
 * timezone and languages (matched to where its traffic comes from), its
 * screen and how large pages draw on it, Chrome's sandbox, a lightweight
 * browser for small hosts, and extra Chrome and Playwright MCP flags. A
 * field left empty uses the default. Saving recreates the computer with
 * them; its files and logins stay.
 */
export default function ComputerBrowserForm({ computer, onUpdated }: Props) {
    const stored = parseComputerBrowserSettings({ text: computer.browser_settings });

    const [timezone, setTimezone] = useState(stored.timezone || "");
    const [language, setLanguage] = useState(stored.language || "");
    const [accept_languages, setAcceptLanguages] = useState(stored.accept_languages || "");
    const [screen, setScreen] = useState<string>(stored.screen || ComputerScreenSizes[0]);
    const [scale, setScale] = useState<string>(stored.scale || ComputerDefaultBrowserScale);
    const [sandbox, setSandbox] = useState(stored.sandbox !== false);
    const [lightweight, setLightweight] = useState(stored.lightweight === true);
    const [browser_args, setBrowserArgs] = useState(stored.browser_args || "");
    const [mcp_args, setMcpArgs] = useState(stored.mcp_args || "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();

    const submit = async () => {
        if (loading) return;
        if (!window.confirm(`Save the browser settings of ${computer.name || "this computer"}? It restarts with them: anything running on it stops. Its files and logins stay.`)) return;

        setLoading(true);
        setError(undefined);

        const res = await postAdminApi<ComputerWithStatus>({
            path: "computers/update-computer",
            body: {
                computer_id: computer.id,
                browser_settings: { timezone, language, accept_languages, screen, scale, sandbox, lightweight: lightweight || undefined, browser_args, mcp_args },
            },
        });

        setLoading(false);

        if (!res.success || !res.singleRes?.id) {
            setError(res.msg || "Couldn't save the browser settings.");
            return;
        }

        onUpdated({ computer: res.singleRes, msg: res.msg || "Saved." });
    };

    return (
        <Form className="w-full gap-4! items-stretch pt-4" onSubmit={submit}>
            <Row className="w-full gap-4! flex-nowrap items-start">
                <Input
                    id="computer-browser-timezone"
                    title="Timezone"
                    label="Timezone"
                    showLabel
                    placeholder="The app's (UTC when unset)"
                    autoComplete="off"
                    defaultValue={timezone}
                    info="An IANA zone, like Africa/Lagos."
                    wrapperWrapperProps={{ className: "grow min-w-0" }}
                    onChange={(e) => setTimezone(e.target.value)}
                />
                <Select
                    id="computer-browser-screen"
                    title="Screen"
                    label="Screen"
                    showLabel
                    options={ComputerScreenSizes.map((size) => ({ value: size, title: size, default: size == screen }))}
                    changeHandler={(value) => setScreen(String(value))}
                    wrapperWrapperProps={{ className: "w-[140px] shrink-0" }}
                />
                <Select
                    id="computer-browser-scale"
                    title="Scale"
                    label="Scale"
                    showLabel
                    options={ComputerBrowserScales.map((value) => ({ value, title: `${value}%`, default: value == scale }))}
                    changeHandler={(value) => setScale(String(value))}
                    wrapperWrapperProps={{ className: "w-[110px] shrink-0" }}
                />
            </Row>
            <Row className="w-full gap-4! flex-nowrap items-start">
                <Input
                    id="computer-browser-language"
                    title="Language"
                    label="Language"
                    showLabel
                    placeholder="en-US"
                    autoComplete="off"
                    defaultValue={language}
                    wrapperWrapperProps={{ className: "grow min-w-0" }}
                    onChange={(e) => setLanguage(e.target.value)}
                />
                <Input
                    id="computer-browser-accept-languages"
                    title="Languages sites see"
                    label="Languages sites see"
                    showLabel
                    placeholder="en-US,en"
                    autoComplete="off"
                    defaultValue={accept_languages}
                    wrapperWrapperProps={{ className: "grow min-w-0" }}
                    onChange={(e) => setAcceptLanguages(e.target.value)}
                />
            </Row>
            <Input
                id="computer-browser-args"
                title="Extra Chrome flags"
                label="Extra Chrome flags"
                showLabel
                placeholder="--force-dark-mode"
                autoComplete="off"
                defaultValue={browser_args}
                info="Space separated. Flags that would open its DevTools or move its profile are refused."
                onChange={(e) => setBrowserArgs(e.target.value)}
            />
            <Input
                id="computer-browser-mcp-args"
                title="Extra Playwright MCP flags"
                label="Extra Playwright MCP flags"
                showLabel
                placeholder="--caps vision"
                autoComplete="off"
                defaultValue={mcp_args}
                info="Space separated. Where it listens and which browser it drives stay the computer's."
                onChange={(e) => setMcpArgs(e.target.value)}
            />
            <Checkbox
                title="Chrome's sandbox"
                label="Chrome's sandbox (turn off only if Chrome won't start: the host blocks user namespaces)"
                checked={sandbox}
                changeHandler={setSandbox}
            />
            <Checkbox
                title="Lightweight browser"
                label="Lightweight browser (for small hosts: no WebGL or software GPU, reduced motion, a slower screen view; sites see a less ordinary browser)"
                checked={lightweight}
                changeHandler={setLightweight}
            />
            <AddFormActions submit_label="Save browser settings" loading={loading} error={error} />
        </Form>
    );
}
