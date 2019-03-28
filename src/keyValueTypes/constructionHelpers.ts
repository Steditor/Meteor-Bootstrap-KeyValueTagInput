import { KeyValueEntry } from "./KeyValueEntry";
import { KeyValueType } from "./KeyValueType";

export interface KeyValueEntryConstructionData {
    key: string;
    value: string | any;
}

export function createEntriesFromTypes(entries: KeyValueEntryConstructionData[], types: Array<KeyValueType<any>>) {
    return entries.map((e) => createEntry(e, types))
        .filter((entry) => entry !== undefined) as Array<KeyValueEntry<any>>;
}

function createEntry(e: KeyValueEntryConstructionData, types: Array<KeyValueType<any>>)
    : KeyValueEntry<any> | undefined {
    for (const type of types) {
        if (type.id === e.key) {
            return type.tryCreateFullEntry(e.value);
        }
    }
    return undefined;
}
