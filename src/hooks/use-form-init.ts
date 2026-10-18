import type { BUN_SQLITE_BSQLITE_ALL_TYPEDEFS } from "@/db/types/db";
import useStatus from "@moduletrace/twui/hooks/useStatus";
import {
    useCallback,
    useContext,
    useEffect,
    useState,
    type Dispatch,
    type SetStateAction,
} from "react";
import { AppContext } from "../pages/__root";
import type { ImageInputToBase64FunctionReturn } from "@moduletrace/twui/utils/form/imageInputToBase64";
import EJSON from "../utils/ejson";
import twuiSlugify from "@moduletrace/twui/utils/slugify";
import _ from "lodash";
import type { AppContextObject } from "../types";

type Params<T extends {} = BUN_SQLITE_BSQLITE_ALL_TYPEDEFS> = {
    /**
     * Existing record for update. All unneccasary fields
     * like join fields should be excluded.
     */
    existing?: T;
    /**
     * Full Existing record with all unneccessary
     * Fields like join fields.
     */
    existing_full?: T;
    default?: T;
    /**
     * Form title.
     */
    title?: string;
    /**
     * Object keys to exclude from local storage.
     * This is useful for image base64 fields
     */
    local_storage_exclude_keys?: (keyof T)[];
    /**
     * Async prep to run before the form is marked ready.
     * Useful for seeding derived fields from the existing record.
     */
    before_ready_function?: (params: {
        form: T;
        setForm: Dispatch<SetStateAction<T>>;
        app_context: AppContextObject;
    }) => Promise<void>;
};

export default function useFormInit<
    T extends {} = BUN_SQLITE_BSQLITE_ALL_TYPEDEFS,
>(params?: Params<T>) {
    const appContext = useContext(AppContext);

    const [form, setForm] = useState<T>(
        params?.existing || params?.default || ({} as T),
    );
    const [image, setImage] = useState<ImageInputToBase64FunctionReturn>();

    const { loading, setLoading, status, setStatus, ready, setReady } =
        useStatus();

    const form_title = params?.title;
    const local_storage_form_title = form_title
        ? twuiSlugify(
              `${form_title.replace(/ ?form$/i, "")}_form_local_storage`,
          )
        : undefined;

    const runBeforeReadyAndSetReady = () => {
        if (params?.before_ready_function) {
            params
                .before_ready_function({
                    form,
                    setForm,
                    app_context: appContext,
                })
                .then(() => {})
                .catch((e2) => {
                    console.log(`Before ready function error:`, e2.message);
                })
                .finally(() => {
                    setReady(true);
                });
        } else {
            setReady(true);
        }
    };

    useEffect(() => {
        if (!ready) return;

        if (status) {
            setStatus(undefined);
        }

        if (local_storage_form_title) {
            try {
                let form_to_store = _.cloneDeep(form);

                if (params?.local_storage_exclude_keys) {
                    params.local_storage_exclude_keys.forEach((k) => {
                        delete form_to_store[k];
                    });
                }

                localStorage.setItem(
                    local_storage_form_title,
                    EJSON.stringify(form_to_store) || "",
                );
            } catch (error) {
            } finally {
            }
        }
    }, [form, ready]);

    useEffect(() => {
        if (local_storage_form_title) {
            try {
                const existing_form_in_local_storage = localStorage.getItem(
                    local_storage_form_title,
                );
                const existing_ls_form_object = EJSON.parse(
                    existing_form_in_local_storage,
                ) as T | undefined;

                if (existing_ls_form_object && !Object.keys(form)?.[0]) {
                    setForm(existing_ls_form_object);
                }
            } catch (error) {
            } finally {
                runBeforeReadyAndSetReady();
            }
        } else {
            runBeforeReadyAndSetReady();
        }
    }, []);

    const clearLocalForm = useCallback(() => {
        if (local_storage_form_title) {
            localStorage.removeItem(local_storage_form_title);
        }
    }, []);

    return {
        form,
        setForm,
        loading,
        setLoading,
        status,
        setStatus,
        existing: params?.existing,
        existing_full: params?.existing_full,
        app_context: appContext,
        image,
        setImage,
        clearLocalForm,
        ready,
        setReady,
    };
}