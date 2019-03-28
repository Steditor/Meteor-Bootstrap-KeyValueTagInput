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
    defaultEntries?: KeyValueEntryConstructionData[];
    entries?: KeyValueEntryConstructionData[];
};

export interface KeyValueEntriesChangedEvent extends CustomEvent {
    detail: Array<KeyValueEntry<any>>;
}

export function clearEntries(keyValueInput: HTMLElement) {
    keyValueInput.dispatchEvent(new CustomEvent("clearEntries"));
}
