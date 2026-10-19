import { useContext, useRef, useState, type ReactNode } from "react";
import Stack from "@moduletrace/twui/layout/Stack";
import { AppContext } from "@/src/pages/__root";
import { SettingsComputersPath } from "@/src/dict/settings-pages-dict";
import isPassThroughUser from "@/src/utils/rbac/is-pass-through-user";
import { AddFlowContext } from "../(data)/add-flow-context";
import { AddChoices, type AddKind } from "../(dict)/add-choices-dict";
import BotForm from "./bot-form";
import AddChoiceRow from "./add-choice-row";
import AddComputerForm from "./add-computer-form";
import AddModalShell from "./add-modal-shell";
import AddNotice from "./add-notice";
import AddWorkspaceForm from "./add-workspace-form";

type Props = {
    children: ReactNode;
};

/**
 * The Add flow for the rail and every page in the bots layout: the Add
 * modal offers a bot, a workspace or (super admins) a computer; picking
 * one opens its form in a modal stacked on top, and closing the form goes
 * back to the choice.
 */
export default function AddFlow({ children }: Props) {
    const { pageProps } = useContext(AppContext);
    const [choosing, setChoosing] = useState(false);
    const [form, setForm] = useState<AddKind | null>(null);
    const [notice, setNotice] = useState<string>();
    /**
     * twui closes every open modal on Escape. While a form is open over the
     * Add modal, the Add modal is remounted open instead, so only the form
     * closes.
     */
    const form_ref = useRef<AddKind | null>(null);
    const [chooser_key, setChooserKey] = useState(0);

    const is_super_admin = isPassThroughUser({ user_types: pageProps?.user_types });
    const choices = AddChoices.filter((choice) => is_super_admin || !choice.super_admin_only);
    const workspace = pageProps?.workspace;

    /**
     * Opens over the Add modal when picked from it, so closing the form
     * goes back to the choice.
     */
    const openForm = ({ kind }: { kind: AddKind }) => {
        setNotice(undefined);
        form_ref.current = kind;
        setForm(kind);
    };

    const close = () => {
        form_ref.current = null;
        setForm(null);
    };

    return (
        <AddFlowContext.Provider value={{ openAdd: () => setChoosing(true), openForm }}>
            {children}
            <AddModalShell
                key={chooser_key}
                open={choosing}
                setOpen={(open) => {
                    if (!open && form_ref.current) {
                        setChooserKey((prev) => prev + 1);
                        return;
                    }

                    setChoosing(open);
                }}
                title="Add"
                description={
                    workspace?.id
                        ? `New bots and computers can join ${workspace.name || "this workspace"} straight away.`
                        : "What would you like to add?"
                }
            >
                <Stack className="w-full mt-3 gap-1! items-stretch">
                    {choices.map((choice) => (
                        <AddChoiceRow
                            key={choice.kind}
                            {...choice}
                            onPick={() => openForm({ kind: choice.kind })}
                        />
                    ))}
                </Stack>
            </AddModalShell>
            <AddModalShell
                open={form == "bot"}
                setOpen={(open) => !open && close()}
                title="Add a bot"
                description="A crew member with a job of its own. The coordinator can hand it work."
            >
                {form == "bot" ? <BotForm onCancel={close} /> : null}
            </AddModalShell>
            <AddModalShell
                open={form == "workspace"}
                setOpen={(open) => !open && close()}
                title="Create a workspace"
                description="Bots working here get its context, its computers and its models."
            >
                {form == "workspace" ? <AddWorkspaceForm onCancel={close} /> : null}
            </AddModalShell>
            <AddModalShell
                open={form == "computer" && is_super_admin}
                setOpen={(open) => !open && close()}
                title="Create a computer"
                description="A new sandbox container on this machine. Its files are kept on disk, even after it's deleted."
            >
                {form != "computer" ? null : notice ? (
                    <AddNotice
                        msg={notice}
                        onDone={() => {
                            close();
                            setChoosing(false);
                        }}
                    />
                ) : (
                    <AddComputerForm
                        onCancel={close}
                        onCreated={({ msg, linked }) => {
                            const pathname = pageProps?.url?.pathname;

                            if (
                                (linked && pathname == `/admin/workspaces/${workspace?.id}`) ||
                                pathname == SettingsComputersPath
                            ) {
                                window.location.reload();
                                return;
                            }

                            setNotice(msg);
                        }}
                    />
                )}
            </AddModalShell>
        </AddFlowContext.Provider>
    );
}
