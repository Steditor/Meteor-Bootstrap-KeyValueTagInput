import { KeyValueEntry, KeyValueEntryConstructionData, KeyValueType } from "../keyValueTypes";

export interface KeyValueInputMultipleTypesData {
    typeKind?: "multiple";
    types: Array<KeyValueType<any>>;
    fallbackType?: number;
}

interface KeyValueInputSingleTypeData {
    typeKind: "single";
    type: KeyValueType<any>;
}

export type KeyValueInputTemplateData = (KeyValueInputMultipleTypesData | KeyValueInputSingleTypeData) & {
    class?: string;
    entryClasses?: {
        key?: string;
        value?: string;
    };
    defaultEntries?: KeyValueEntryConstructionData[];
    entries?: KeyValueEntryConstructionData[];
    valueKind?: "single" | "multiple";
    allowDuplicates?: boolean;
};

export interface KeyValueEntriesChangedEvent<T = any> extends CustomEvent<Array<KeyValueEntry<T>>> {
    detail: Array<KeyValueEntry<T>>;
}

export function clearEntries(keyValueInput: HTMLElement) {
    keyValueInput.dispatchEvent(new CustomEvent("clearEntries"));
}
