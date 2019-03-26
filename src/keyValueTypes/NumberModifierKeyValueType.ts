import { KeyValueSuggestion, KeyValueTextDisplay, KeyValueType } from "./KeyValueType";

import { Meteor } from "meteor/meteor";

import { NumberDelimiters } from "../helpers/formatting";
import { escapeRegexChars } from "../helpers/strings";
import NumberFormat = Intl.NumberFormat;

type Operator = "=" | "*" | "/" | "+" | "-";
type OpSymbol = "=" | "*" | "÷" | "+" | "-";

const symbolForOperator: { [K in Operator]: OpSymbol } = {
    "=": "=",
    "*": "*",
    "/": "÷",
    "+": "+",
    "-": "-",
};

const operatorsAndSymbols: Array<OpSymbol | Operator> = [ "=", "*", "/", "+", "-", "÷" ];

function toSymbol(op: OpSymbol | Operator): OpSymbol {
    // @ts-ignore missing index signature of mapped type
    return symbolForOperator[op] || op;
}

interface SlackNumberModifierKeyValue {
    operator: OpSymbol | Operator;
    number: number;
}
interface NumberModifierKeyValue extends SlackNumberModifierKeyValue {
    operator: Operator;
}

export type RoundMode = "not" | "up" | "down" | "math";

export default class NumberModifierKeyValueType extends KeyValueType<NumberModifierKeyValue> {
    public static apply(value: NumberModifierKeyValue, number: number, roundMode: RoundMode = "not"): number {
        let result;
        switch (value.operator) {
            case "=":
                result = value.number;
                break;
            case "*":
                result = number * value.number;
                break;
            case "/":
                result = number / value.number;
                break;
            case "+":
                result = number + value.number;
                break;
            case "-":
                result = number - value.number;
                break;
            default:
                throw new Meteor.Error("invalid-number-modifier",
                    `'${value.operator}' is not a valid operation on numbers.`);
        }

        switch (roundMode) {
            case "up":
                result = Math.ceil(result);
                break;
            case "down":
                result = Math.floor(result);
                break;
            case "math":
                result = Math.round(result);
                break;
            case "not":
            default:
                // no rounding
        }

        return result;
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
            let operators = Object.keys(symbolForOperator) as Array<OpSymbol | Operator>;
            if (prefix !== "") {
                number = parsed ? parsed.number : number;
                const filteredOperators = operatorsAndSymbols.filter((op) => op.startsWith(prefix));
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

    public parseString(val: string): NumberModifierKeyValue | undefined {
        let value = val.trim();
        if (value === "") {
            return undefined;
        }
        value = value.replace(/\s/g, "") // remove spaces
            .replace(this._groupsDelimiterRegex, "") // remove grouping delimiters
            .replace(this._delimiters.decimal, "."); // convert to decimal point
        const match = value.replace("÷", "/")
            .match(/^([=*/+-])?(-?\d*\.?\d+)/);

        if (match) {
            return {
                operator: match[1] as Operator || "=",
                number: Number(match[2]),
            };
        } else {
            return undefined;
        }
    }

    public checkValue(val: any): NumberModifierKeyValue | undefined {
        if (Object.keys(symbolForOperator).includes(val.operator) && typeof val.number === "number") {
            return val;
        } else {
            return undefined;
        }
    }

    public display(value: SlackNumberModifierKeyValue): KeyValueTextDisplay {
        const numberString = this._numberFormatter ? this._numberFormatter.format(value.number) : String(value.number);
        return { text: toSymbol(value.operator) + " " + numberString };
    }

    public editText(value: SlackNumberModifierKeyValue): string {
        return this.display(value).text;
    }
}
