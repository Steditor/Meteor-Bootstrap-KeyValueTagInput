import { KeyValueSuggestion, KeyValueTextDisplay } from "./KeyValueDatatypes";
import { KeyValueEntry } from "./KeyValueEntry";
import { KeyValueType } from "./KeyValueType";

export default class TagKeyValueType extends KeyValueType<string> {
    private _tags: string[] = [];

    set tags(tags: string[]) {
        this._tags = tags;
    }

    private _allowOther: boolean = false;

    set allowOther(allowOther: boolean) {
        this._allowOther = allowOther;
    }

    public getSuggestions(prefix: string, entries: Array<KeyValueEntry<any>>, defaultEntries: Array<KeyValueEntry<any>>,
                          allowDuplicates: boolean): KeyValueSuggestion[] {
        const substringLower = prefix.toLowerCase();
        let tags = this._tags.filter((t) => t.toLowerCase().includes(substringLower))
        if (!allowDuplicates) {
            tags = tags.filter((t) =>
                entries.every((e) => e.value !== t) &&
                defaultEntries.every((e) => e.value !== t),
            );
        }
        return tags.map((t) => ({
                display: { text: t },
                match: prefix !== "" ? t : undefined,
                value: t,
            }));
    }

    public parseString(val: string): string | undefined {
        if (this._allowOther && val.trim() !== "") { return val.trim(); }
        const value = val.trim().toLowerCase();
        return this._tags.find((t) => t.toLowerCase() === value);
    }

    public checkValue(val: any): string | undefined {
        if (typeof val === "string") {
            return this.parseString(val);
        } else {
            return undefined;
        }
    }

    public display(value: string): KeyValueTextDisplay {
        return { text: value };
    }

    public editText(value: string): string {
        return value;
    }
}
