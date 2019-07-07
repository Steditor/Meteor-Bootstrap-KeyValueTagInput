import { KeyValueEntryConstructionData } from "./constructionHelpers";
import { KeyValueDisplay, KeyValueSuggestion } from "./KeyValueDatatypes";
import { KeyValueType } from "./KeyValueType";

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
        if (this.value === undefined) {
            return undefined;
        }
        return this._type.display(this.value);
    }

    get editText(): string | undefined {
        if (this.value === undefined) {
            return undefined;
        }
        return this._type.editText(this.value);
    }

    get constructionData(): KeyValueEntryConstructionData {
        return {
            key: this.id,
            value: this.editText,
        };
    }

    public equals(entry: KeyValueEntry<any>): boolean {
        return this._type.isEqual(this, entry);
    }
}
