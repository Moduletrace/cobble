import HarnessError from "./harness-error";

type Params = {
    error: unknown;
};

/**
 * A failed model call as a tool reports it: the model the setting picked,
 * then the error's own words. The model is the fact a bot kept filling in for
 * itself: given only "Alibaba Cloud Token Plan: HTTP 404", a production bot
 * told the user the call was being routed to a model nobody had configured.
 */
export default function describeHarnessFailure({ error }: Params) {
    const message = error instanceof Error ? error.message : String(error);
    const model = error instanceof HarnessError ? error.model_name : undefined;

    return model && !message.startsWith(model) ? `${model}: ${message}` : message;
}