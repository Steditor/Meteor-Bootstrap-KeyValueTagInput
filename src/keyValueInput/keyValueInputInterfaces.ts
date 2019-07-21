import { KeyValueEntry, KeyValueEntryConstructionData, KeyValueType } from "../keyValueTypes";

export interface KeyValueInputMultipleTypesData {
    kind?: "multiple";
    types: Array<KeyValueType<any>>;
    fallbackType?: number;
}

interface KeyValueInputSingleTypeData {
    kind: "single";
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

export interface KeyValueEntriesChangedEvent extends CustomEvent {
    detail: Array<KeyValueEntry<any>>;
}

export function clearEntries(keyValueInput: HTMLElement) {
    keyValueInput.dispatchEvent(new CustomEvent("clearEntries"));
}
