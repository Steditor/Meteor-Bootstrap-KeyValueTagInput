import { KeyValueDisplay, KeyValueSuggestion } from "./KeyValueDatatypes";
import { KeyValueEntry } from "./KeyValueEntry";

export abstract class KeyValueType<T> {
    private readonly _id: string;
    private readonly _label: string;
    private readonly _aliases: string[];

    constructor(id: string, label: string, aliases: string[] = []) {
        this._id = id;
        this._label = label;
        this._aliases = [ id, label, ...aliases ].map((a) => a.toLowerCase());
    }

    get id(): string {
        return this._id;
    }

    get label(): string {
        return this._label;
    }

    get aliases(): string[] {
        return this._aliases;
    }

    public findAlias(substring: string): string | undefined {
        const substringLower = substring.toLowerCase();
        return this.aliases.find((a) => a.includes(substringLower));
    }

    public createPartialEntry(): KeyValueEntry<T> {
        return new KeyValueEntry(this);
    }

    public tryCreatePartialEntry(key: string): KeyValueEntry<T> | undefined {
        if (!this.aliases.includes(key.toLowerCase())) {
            return undefined;
        }

        return new KeyValueEntry(this);
    }

    public tryCreateFullEntry(val: T | string): KeyValueEntry<T> | undefined {
        const entry = new KeyValueEntry(this);
        if (entry.set(val)) {
            return entry;
        } else {
            return undefined;
        }
    }

    public abstract getSuggestions(prefix: string): KeyValueSuggestion[];

    public abstract parseString(val: string): T | undefined;

    public abstract checkValue(val: any): T | undefined;

    public abstract display(value: T): KeyValueDisplay;

    public abstract editText(value: T): string;

    public isEqual(entryA: KeyValueEntry<T>, entryB: KeyValueEntry<any>): boolean {
        return entryA.type === entryB.type && entryA.value === entryB.value;
    }
}
