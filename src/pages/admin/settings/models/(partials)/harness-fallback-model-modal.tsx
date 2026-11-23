import { useState, type Dispatch, type SetStateAction } from "react";
import Modal from "@moduletrace/twui/elements/Modal";
import SearchSelect from "@moduletrace/twui/form/SearchSelect";
import Button from "@moduletrace/twui/layout/Button";
import H2 from "@moduletrace/twui/layout/H2";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { Plus } from "lucide-react";
import type { HarnessModelOption, HarnessProviderChoice } from "@/src/types";
import harnessFallbackModelOptions from "../(utils)/harness-fallback-model-options";
import HarnessProviderSelect from "./harness-provider-select";

type Props = {
    id: string;
    providers: HarnessProviderChoice[];
    models: HarnessModelOption[];
    /**
     * The pick and the backups already saved.
     */
    taken: number[];
    /**
     * The list is full.
     */
    disabled: boolean;
    onAdd: (model_id: number) => void;
};

/**
 * "Add a backup": a provider, then one of its models, added to the list
 * when the button is pressed.
 */
export default function HarnessFallbackModelModal({ id, providers, models, taken, disabled, onAdd }: Props) {
    const [open, set_open] = useState(false);
    const [provider_id, set_provider_id] = useState<number | null>(null);
    const [model_id, set_model_id] = useState<number | null>(null);

    const offered = provider_id ? models.filter((model) => model.provider_id == provider_id) : models;

    const close = () => {
        set_open(false);
        set_provider_id(null);
        set_model_id(null);
    };

    /**
     * Anything but a close (the backdrop, the escape key, a click on the
     * target) goes through here, so a cancelled pick is never left behind.
     */
    const setOpen: Dispatch<SetStateAction<boolean>> = (next) => {
        const value = typeof next == "function" ? next(open) : next;

        if (value) set_open(true);
        else close();
    };

    return (
        <Modal
            target={
                <Button
                    title={disabled ? "The backup list is full" : "Add a backup model"}
                    type="button"
                    variant="outlined"
                    color="gray"
                    size="small"
                    disabled={disabled}
                    onClick={() => set_open(true)}
                >
                    <Plus size={16} aria-hidden />
                    Add backup
                </Button>
            }
            targetWrapperProps={{ className: "self-end" }}
            open={open}
            setOpen={setOpen}
            className="max-w-lg bg-paper p-6"
        >
            <Stack className="w-full gap-1! items-stretch pb-2">
                <H2 className="text-lg! leading-6! tracking-normal! font-bold text-ink">Add a backup model</H2>
                <Span className="text-[13px] leading-[18px] text-ink-secondary">
                    Pick its provider and model. It is tried after the backups already on the list.
                </Span>
            </Stack>
            <Stack className="w-full gap-4! items-stretch">
                <HarnessProviderSelect
                    id={`${id}-backup-provider`}
                    providers={providers}
                    provider_id={provider_id}
                    onChange={(next) => {
                        set_provider_id(next.provider_id);
                        set_model_id(null);
                    }}
                />
                <SearchSelect
                    key={`${provider_id || "any"}-${model_id ?? "none"}`}
                    id={`${id}-backup-model`}
                    title="Model"
                    label="Model"
                    showLabel
                    placeholder="Search models"
                    options={harnessFallbackModelOptions({
                        models: offered,
                        model_id: model_id ?? undefined,
                        taken,
                    })}
                    defaultValues={model_id ? [String(model_id)] : []}
                    changeHandler={(value) => {
                        const picked = Array.isArray(value) ? value[0] : value;
                        set_model_id(picked ? Number(picked) : null);
                    }}
                />
            </Stack>
            <Row className="w-full gap-2! items-center justify-end pt-4">
                <Button title="Cancel" type="button" variant="ghost" color="gray" size="small" onClick={close}>
                    Cancel
                </Button>
                <Button
                    title="Add backup"
                    type="button"
                    size="small"
                    disabled={!model_id}
                    onClick={() => {
                        if (!model_id) return;
                        onAdd(model_id);
                        close();
                    }}
                >
                    Add backup
                </Button>
            </Row>
        </Modal>
    );
}