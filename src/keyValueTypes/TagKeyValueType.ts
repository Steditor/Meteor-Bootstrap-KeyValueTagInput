import { KeyValueDisplay, KeyValueSuggestion } from "./KeyValueDatatypes";
import { KeyValueEntry } from "./KeyValueEntry";
import { KeyValueType } from "./KeyValueType";

export interface Tag {
    value: string;
    editString?: string;
    display?: KeyValueDisplay;
}

function stringToTag(value: string): Tag {
    return { value, display: { text: value } };
}

function isTags(tags: string[] | Tag[]): tags is Tag[] {
    return tags.length === 0 || typeof tags[0] !== "string";
}

export default class TagKeyValueType extends KeyValueType<Tag> {
    private _tags: Tag[] = [];

    set tags(tags: string[] | Tag[]) {
        if (isTags(tags)) {
            this._tags = tags;
        } else {
            this._tags = tags.map(stringToTag);
        }
    }

    private _allowOther: boolean = false;

    set allowOther(allowOther: boolean) {
        this._allowOther = allowOther;
    }

    public getSuggestions(prefix: string, entries: Array<KeyValueEntry<any>>, defaultEntries: Array<KeyValueEntry<any>>,
                          allowDuplicates: boolean): KeyValueSuggestion[] {
        const substringLower = prefix.toLowerCase();
        let tags = this._tags.filter((t) =>
            t.value.toLowerCase().includes(substringLower) || t.editString?.toLowerCase().includes(substringLower),
        );
        if (!allowDuplicates) {
            tags = tags.filter((t) =>
                entries.every((e) => e.type === this && !this.isValueEqual(t, e.value)) &&
                defaultEntries.every((e) => e.type === this && !this.isValueEqual(t, e.value)),
            );
        }
        return tags.map((t) => ({
                display: this.display(t),
                match: prefix !== "" ?
                    ((t.editString ?? "").toLowerCase().includes(substringLower) ? t.editString : t.value)
                    : undefined,
                value: t.value,
            }));
    }

    public parseString(val: string): Tag | undefined {
        const value = val.trim().toLowerCase();
        const tag = this._tags.find((t) => t.value.toLowerCase() === value || t.editString?.toLowerCase() === value);
        if (tag) { return tag; }
        if (this._allowOther && val.trim() !== "") { return stringToTag(val.trim()); }
    }

    public checkValue(val: any): Tag | undefined {
        if (typeof val === "string") {
            return this.parseString(val);
        } else {
            return undefined;
        }
    }

    public display(value: Tag): KeyValueDisplay {
        return value.display ?? { text: value.editString ?? value.value };
    }

    public editText(value: Tag): string {
        return value.editString ?? value.value;
    }

    public isValueEqual(valueA?: Tag, valueB?: Tag): boolean {
        if (super.isValueEqual(valueA, valueB)) { return true; }

        if (valueA && valueB) {
            return valueA.value === valueB.value;
        }
        return false;
    }
}
