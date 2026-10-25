import { useState } from "react";
import AddFormActions from "@/src/layouts/bots/(partials)/add-form-actions";
import AddModalShell from "@/src/layouts/bots/(partials)/add-modal-shell";
import Checkbox from "@moduletrace/twui/form/Checkbox";
import Form from "@moduletrace/twui/form/Form";
import Input from "@moduletrace/twui/form/Input";
import Textarea from "@moduletrace/twui/form/Textarea";
import CodeEditor from "@/src/components/general/code-editor";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import type { PublicSkill, SkillLimitsOverview, SkillsOverviewPayload } from "@/src/types";

type Props = {
    /**
     * Edits this skill; adds one when not given.
     */
    skill?: PublicSkill;
    /**
     * The install's runbook limits, for the hint.
     */
    limits: SkillLimitsOverview;
    onSaved: (overview: SkillsOverviewPayload, msg: string) => void;
    onCancel: () => void;
};

/**
 * Adds or edits a skill: the name the settings page shows, the slug a bot
 * loads it by, the one line that tells the bot when it applies, and the
 * runbook itself in markdown.
 */
export default function SkillModal({ skill, limits, onSaved, onCancel }: Props) {
    const [name, setName] = useState(skill?.name || "");
    const [slug, setSlug] = useState(skill?.slug || "");
    const [description, setDescription] = useState(skill?.description || "");
    const [body, setBody] = useState(skill?.body || "");
    const [enabled, setEnabled] = useState(skill?.enabled ?? true);
    const [all_bots, setAllBots] = useState(skill?.access.all_bots ?? false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();

    const id = `skill-${skill?.id || "new"}`;

    const submit = async () => {
        if (loading || !window.confirm(skill ? `Save ${skill.name}?` : `Add ${name || "this skill"}?`)) return;

        setLoading(true);
        setError(undefined);

        const res = await postAdminApi<SkillsOverviewPayload>({
            path: "skills/save-skill",
            body: { skill_id: skill?.id, name, slug, description, body, enabled, all_bots },
        });

        setLoading(false);

        if (!res.success || !res.singleRes) {
            setError(res.msg || "Couldn't save the skill.");
            return;
        }

        onSaved(res.singleRes, res.msg || "Saved.");
    };

    return (
        <AddModalShell
            open
            setOpen={(next) => !next && onCancel()}
            title={skill ? `Edit ${skill.name}` : "Add a skill"}
            description={"Bots get it once it's attached to them."}
        >
            <Form className="w-full gap-4! items-stretch pt-4" onSubmit={submit}>
                <Input
                    id={`${id}-name`}
                    title="Name"
                    label="Name"
                    showLabel
                    placeholder="Weekly SEO report"
                    defaultValue={name}
                    autoComplete="off"
                    info="What the settings page calls it."
                    onChange={(e) => setName(e.target.value)}
                />
                <Input
                    id={`${id}-slug`}
                    title="Slug"
                    label="Slug"
                    showLabel
                    placeholder="weekly-seo-report"
                    defaultValue={slug}
                    autoComplete="off"
                    info="What a bot passes to load_skill: lowercase letters, numbers and hyphens. Unique."
                    onChange={(e) => setSlug(e.target.value)}
                />
                <Textarea
                    id={`${id}-description`}
                    title="When to use it"
                    label="When to use it"
                    showLabel
                    rows={2}
                    placeholder="Use for the Monday search report: rankings, traffic and what changed."
                    defaultValue={description}
                    info="The one line a bot reads to decide whether this skill applies. Say what job it covers."
                    onChange={(e) => setDescription(e.target.value)}
                />
                <CodeEditor
                    mode="markdown"
                    className="h-80"
                    title="Runbook"
                    content={body}
                    info={`Markdown. The steps, the checks, and what good looks like. Up to ${limits.body_max_chars} characters. A bot reads it only when it loads the skill, up to ${limits.body_shown_chars} characters of it at a time.`}
                    onChange={(value) => setBody(value)}
                />
                <Checkbox title="On" label="On: bots get it" checked={enabled} changeHandler={setEnabled} />
                <Checkbox
                    title="Every bot"
                    label="Every bot by default: every bot now and every new one, the coordinator included. Each can still drop it."
                    checked={all_bots}
                    changeHandler={setAllBots}
                />
                <AddFormActions submit_label={skill ? "Save" : "Add skill"} loading={loading} error={error} onCancel={onCancel} />
            </Form>
        </AddModalShell>
    );
}
