export class KeyValueEntry<T> {
    public isDefault?: boolean;

    private readonly _type: KeyValueType<T>;
    private _value: T | undefined = undefined;

    constructor(type: KeyValueType<T>) {
        this._type = type;
    }

    get type(): KeyValueType<T> {
        return this._type;
    }

    get id() {
        return this._type.id;
    }

    get label() {
        return this._type.label;
    }

    public getSuggestions(prefix: string): KeyValueSuggestion[] {
        return this._type.getSuggestions(prefix);
    }

    public parse(val: T | string): T | undefined {
        if (typeof val === "string") {
            return this._type.parseString(val);
        } else if (val !== undefined) {
            return this._type.checkValue(val);
        }
        return undefined;
    }

    public set(val: T | string): boolean {
        this._value = this.parse(val);
        return this._value !== undefined;
    }

    get value(): T | undefined {
        return this._value;
    }

    get isPartial(): boolean {
        return this.value === undefined;
    }

    get display(): KeyValueDisplay | undefined {
        if (this.value === undefined) { return undefined; }
        return this._type.display(this.value);
    }

    get editText(): string | undefined {
        if (this.value === undefined) { return undefined; }
        return this._type.editText(this.value);
    }

    public equals(entry: KeyValueEntry<any>): boolean {
        return this._type.isEqual(this, entry);
    }
}

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

export interface KeyValueTextDisplay {
    text: string;
}
export interface KeyValueHtmlDisplay {
    html: string;
}
export type KeyValueDisplay = KeyValueTextDisplay | KeyValueHtmlDisplay;

export interface KeyValueSuggestion {
    display: KeyValueDisplay;
    match?: string;
    matchHtml?: string;
    value: string;
    extra?: string;
    fallback?: boolean;
}
