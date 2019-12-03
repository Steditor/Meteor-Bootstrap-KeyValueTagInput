import { NumberDelimiters } from "../helpers/formatting";
import {
    CompOperator,
    compOperators,
    compOpsAndSymbols,
    CompOpSymbol,
    compOpToSelector,
    compOpToSymbol,
} from "../helpers/operators";
import { escapeRegexChars } from "../helpers/strings";
import { KeyValueSuggestion, KeyValueTextDisplay } from "./KeyValueDatatypes";
import { KeyValueType } from "./KeyValueType";
import NumberFormat = Intl.NumberFormat;

export interface SlackNumberKeyValue {
    operator: CompOpSymbol | CompOperator;
    number: number;
}
export interface NumberKeyValue extends SlackNumberKeyValue {
    operator: CompOperator;
}

export default class NumberKeyValueType extends KeyValueType<NumberKeyValue> {
    public static mongoSelectorFor(value: NumberKeyValue, numberTransform: (n: number) => number = (n) => n) {
        return { [compOpToSelector(value.operator)]: numberTransform(value.number) };
    }

    private _delimiters: NumberDelimiters = {
        decimal: ".",
        groups: ",",
    };
    private _groupsDelimiterRegex = /,/gi;
    set delimiters(delimiters: NumberDelimiters) {
        this._delimiters = delimiters;
        this._groupsDelimiterRegex = new RegExp(escapeRegexChars(this._delimiters.groups), "gi");
    }

    private _numberFormatter?: NumberFormat;
    set numberFormatter(numberFormatter: NumberFormat | undefined) {
        this._numberFormatter = numberFormatter;
    }

    public getSuggestions(prefix: string): KeyValueSuggestion[] {
        const parsed = this.parseString(prefix);
        // empty input or invalid input or fallback "="
        if (prefix === "" || !parsed || (parsed.operator === "=" && !prefix.startsWith("="))) {
            let number = 42;
            let operators = Object.keys(compOperators) as Array<CompOpSymbol | CompOperator>;
            if (prefix !== "") {
                number = parsed ? parsed.number : number;
                const filteredOperators = compOpsAndSymbols.filter((op) => op.startsWith(prefix));
                operators = filteredOperators.length > 0 ? filteredOperators : operators;
            }

            return operators.map((operator) => ({
                display: this.display({ operator, number })!,
                value: this.editText({ operator, number })!,
            }));
        } else {
            return [];
        }
    }

    public parseString(val: string): NumberKeyValue | undefined {
        let value = val.trim();
        if (value === "") {
            value = ">0";
        }
        value = value.replace(/\s/g, "") // remove spaces
            .replace(this._groupsDelimiterRegex, "") // remove grouping delimiters
            .replace(this._delimiters.decimal, "."); // convert to decimal point
        const match = value.replace("≥", ">=")
            .replace("≤", "<=")
            .replace("<>", "!=")
            .replace("≠", "!=")
            .replace("==", "=")
            .match(/^(<=|<|>=|>|!=|=)?(-?\d*\.?\d+)/);

        if (match) {
            return {
                operator: match[1] as CompOperator ?? "=",
                number: Number(match[2]),
            };
        } else {
            return undefined;
        }
    }

    public checkValue(val: any): NumberKeyValue | undefined {
        if (Object.keys(compOperators).includes(val.operator) && typeof val.number === "number") {
            return val;
        } else {
            return undefined;
        }
    }

    public display(value: SlackNumberKeyValue): KeyValueTextDisplay {
        const numberString = this._numberFormatter ? this._numberFormatter.format(value.number) : String(value.number);
        return { text: compOpToSymbol(value.operator) + " " + numberString };
    }

    public editText(value: SlackNumberKeyValue): string {
        return this.display(value).text;
    }

    public isValueEqual(valueA?: NumberKeyValue, valueB?: NumberKeyValue): boolean {
        if (super.isValueEqual(valueA, valueB)) { return true; }

        if (valueA && valueB) {
            return valueA.operator === valueB.operator && valueA.number === valueB.number;
        }
        return false;
    }
}
