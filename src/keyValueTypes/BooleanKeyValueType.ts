import { KeyValueSuggestion, KeyValueTextDisplay } from "./KeyValueDatatypes";
import { KeyValueType } from "./KeyValueType";

import { Meteor } from "meteor/meteor";

export const trueValues = [ "ja", "yes", "wahr", "true", "1", "✓" ];
export const falseValues = [ "nein", "no", "falsch", "false", "0", "✗" ];

export default class BooleanKeyValueType extends KeyValueType<boolean> {
    public static validate(val: any) {
        if (typeof val === "boolean") {
            return val;
        } else {
            throw new Meteor.Error("invalid-boolean", `'${val}' is not a valid boolean.`);
        }
    }

    public getSuggestions(prefix: string): KeyValueSuggestion[] {
        const substringLower = prefix.toLowerCase();
        const trueValue = trueValues.find((val) => val.includes(substringLower));
        const falseValue = falseValues.find((val) => val.includes(substringLower));

        return [
            { display: this.display(true), match: trueValue, value: trueValues[0] },
            { display: this.display(false), match: falseValue, value: falseValues[0] },
        ].filter((o) => o.match !== undefined);
    }

    public parseString(val: string): boolean | undefined {
        const value = val.toLowerCase();
        if (value === "" || trueValues.includes(value)) {
            return true;
        } else if (falseValues.includes(value)) {
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

    public display(value: boolean): KeyValueTextDisplay {
        if (value) {
            return { text: "✓" };
        } else {
            return { text: "✗" };
        }
    }

    public editText(value: boolean): string {
        if (value) {
            return trueValues[0];
        } else {
            return falseValues[0];
        }
    }
}
