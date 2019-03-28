import { KeyValueHtmlDisplay, KeyValueSuggestion } from "./KeyValueDatatypes";
import { KeyValueType } from "./KeyValueType";

export const ascendingValues = [ "aufsteigend", "auf", "asc", "ascending", "up", "1", "+" ];
export const descendingValues = [ "absteigend", "ab", "desc", "descending", "down", "-1", "-" ];

export default class SortKeyValueType extends KeyValueType<boolean> {
    public static mongoSpecifierFor(value: boolean): string {
        return value ? "asc" : "desc";
    }

    public getSuggestions(prefix: string): KeyValueSuggestion[] {
        const substringLower = prefix.toLowerCase();
        const ascendingValue = ascendingValues.find((val) => val.includes(substringLower));
        const descendingValue = descendingValues.find((val) => val.includes(substringLower));

        return [
            { display: this.display(true), match: ascendingValue, value: ascendingValues[0] },
            { display: this.display(false), match: descendingValue, value: descendingValues[0] },
        ].filter((o) => o.match !== undefined);
    }

    public parseString(val: string): boolean | undefined {
        const value = val.trim().toLowerCase();
        if (value === "" || ascendingValues.includes(value)) {
            return true;
        } else if (descendingValues.includes(value)) {
            return false;
        } else {
            return undefined;
        }
    }

    public checkValue(val: any): boolean | undefined {
        if (typeof val === "boolean") {
            return val;
        } else {
            return undefined;
        }
    }

    public display(value: boolean): KeyValueHtmlDisplay {
        if (value) {
            return { html: "<i class='fa fa-sort-up'></i>" };
        } else {
            return { html: "<i class='fa fa-sort-down'></i>" };
        }
    }

    public editText(value: boolean): string {
        if (value) {
            return ascendingValues[0];
        } else {
            return descendingValues[0];
        }
    }
}
