import { NumberDelimiters } from "../helpers/formatting";
import { escapeRegexChars } from "../helpers/strings";
import { KeyValueSuggestion, KeyValueTextDisplay, KeyValueType } from "./KeyValueType";
import NumberFormat = Intl.NumberFormat;

type Operator = "<" | ">" | "<=" | ">=" | "!=" | "=";
type OpSymbol = "<" | ">" | "≤" | "≥" | "≠" | "=";

const symbolForOperator: { [K in Operator]: OpSymbol } = {
    "<": "<",
    ">": ">",
    "<=": "≤",
    ">=": "≥",
    "!=": "≠",
    "=": "=",
};

const operatorsAndSymbols: Array<OpSymbol | Operator> = [ "<", ">", "<=", ">=", "!=", "=", "≤", "≥", "≠" ];

function toSymbol(op: OpSymbol | Operator): OpSymbol {
    // @ts-ignore missing index signature of mapped type
    return symbolForOperator[op] || op;
}

type OpSelector = "$lt" | "$gt" | "$lte" | "$gte" | "$ne" | "$eq";
const selectorForOperator: { [K in Operator]: OpSelector } = {
    "<": "$lt",
    ">": "$gt",
    "<=": "$lte",
    ">=": "$gte",
    "!=": "$ne",
    "=": "$eq",
};
function toSelector(op: Operator): OpSelector {
    // @ts-ignore missing index signature of mapped type
    return selectorForOperator[op];
}

interface SlackNumberKeyValue {
    operator: OpSymbol | Operator;
    number: number;
}
interface NumberKeyValue extends SlackNumberKeyValue {
    operator: Operator;
}

export default class NumberKeyValueType extends KeyValueType<NumberKeyValue> {
    public static mongoSelectorFor(value: NumberKeyValue, numberTransform: (n: number) => number = (n) => n) {
        return { [toSelector(value.operator)]: numberTransform(value.number) };
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
                operator: match[1] as Operator || "=",
                number: Number(match[2]),
            };
        } else {
            return undefined;
        }
    }

    public checkValue(val: any): NumberKeyValue | undefined {
        if (Object.keys(symbolForOperator).includes(val.operator) && typeof val.number === "number") {
            return val;
        } else {
            return undefined;
        }
    }

    public display(value: SlackNumberKeyValue): KeyValueTextDisplay {
        const numberString = this._numberFormatter ? this._numberFormatter.format(value.number) : String(value.number);
        return { text: toSymbol(value.operator) + " " + numberString };
    }

    public editText(value: SlackNumberKeyValue): string {
        return this.display(value).text;
    }
}
