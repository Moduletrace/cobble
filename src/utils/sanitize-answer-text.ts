import stripAppRecords from "./strip-app-records";
import stripCardRefs from "./strip-card-refs";
import stripUnresolvedSettingRefs from "./strip-unresolved-setting-refs";

/**
 * What the app takes out of an answer before anything reads it: a
 * `[setting:...]` pill that leads nowhere, an app record line the run's
 * own tools don't support, and the ref of a card the app adds itself
 * (`[question:]`, `[suggestion:]`, `[plan:]`). All are text the app would
 * never show as its own word, so they are removed rather than sent back for
 * a rewrite: three faults in one run used to cost the user an answer that
 * was otherwise right (`reviewBotReply`).
 */
export default function sanitizeAnswerText({ text }: { text: string }) {
    return stripCardRefs({ text: stripAppRecords({ text: stripUnresolvedSettingRefs({ text }) }) });
}