import type { ComponentType } from "react";
import AppearanceSection from "../(sections)/appearance-section";
import AppNetworksSection from "../(sections)/app-networks-section";
import BotTraceRetentionSection from "../(sections)/bot-trace-retention-section";
import AskRetentionSection from "../(sections)/ask-retention-section";
import ComputerWorkspacesSection from "../(sections)/computer-workspaces-section";
import HookCallRetentionSection from "../(sections)/hook-call-retention-section";
import InstallIconSection from "../(sections)/install-icon-section";
import InstallNameSection from "../(sections)/install-name-section";
import LogRetentionSection from "../(sections)/log-retention-section";
import MessageLengthSection from "../(sections)/message-length-section";
import NotificationsSection from "../(sections)/notifications-section";
import PromptSection from "../(sections)/prompt-section";
import RunLimitsSection from "../(sections)/run-limits-section";
import SessionLengthSection from "../(sections)/session-length-section";
import SkillLimitsSection from "../(sections)/skill-limits-section";
import StorageSection from "../(sections)/storage-section";
import VersionSection from "../(sections)/version-section";

/**
 * Each group of General settings, keyed as `GeneralSettingsSections` names
 * it, so the group's own page shows the same section the full page does
 * (and the same form, when the user may change it).
 */
const GeneralSettingsSectionComponents: Record<string, ComponentType> = {
    theme: AppearanceSection,
    "docker-networks": AppNetworksSection,
    asks: AskRetentionSection,
    "computer-workspaces": ComputerWorkspacesSection,
    "hook-calls": HookCallRetentionSection,
    "run-traces": BotTraceRetentionSection,
    "install-icon": InstallIconSection,
    "install-name": InstallNameSection,
    "activity-log": LogRetentionSection,
    messages: MessageLengthSection,
    notifications: NotificationsSection,
    "prompt-appendix": PromptSection,
    "run-limits": RunLimitsSection,
    sessions: SessionLengthSection,
    "skill-limits": SkillLimitsSection,
    storage: StorageSection,
    version: VersionSection,
};

export default GeneralSettingsSectionComponents;