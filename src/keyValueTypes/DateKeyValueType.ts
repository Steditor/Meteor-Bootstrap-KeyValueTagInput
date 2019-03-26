import { KeyValueSuggestion, KeyValueTextDisplay, KeyValueType } from "./KeyValueType";

import * as moment_ from "moment";
const moment = moment_;

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

interface SlackDateKeyValue {
    operator: OpSymbol | Operator;
    date: Date;
}
interface DateKeyValue extends SlackDateKeyValue {
    operator: Operator;
}

export default class DateKeyValueType extends KeyValueType<DateKeyValue> {
    public static mongoSelectorFor(value: DateKeyValue) {
        return { [toSelector(value.operator)]: value.date };
    }

    private _dateFormat: string = "YYYY-MM-DD";
    set dateFormat(dateFormat: string) {
        this._dateFormat = dateFormat;
    }

    private _dateParseFormats: string[] = [ "YYYY-MM-DD", "YY-MM-DD", "MM-DD" ];
    set dateParseFormats(dateParseFormats: string[]) {
        this._dateParseFormats = dateParseFormats;
    }

    public getSuggestions(prefix: string): KeyValueSuggestion[] {
        const parsed = this.parseString(prefix);
        // empty input or invalid input or fallback "="
        if (prefix === "" || !parsed || (parsed.operator === "=" && !prefix.startsWith("="))) {
            let date = new Date();
            let operators = Object.keys(symbolForOperator) as Array<OpSymbol | Operator>;
            if (prefix !== "") {
                date = parsed ? parsed.date : date;
                const filteredOperators = operatorsAndSymbols.filter((op) => op.startsWith(prefix));
                operators = filteredOperators.length > 0 ? filteredOperators : operators;
            }

            return operators.map((operator) => ({
                display: this.display({ operator, date })!,
                value: this.editText({ operator, date })!,
            }));
        } else {
            return [];
        }
    }

    public parseString(val: string): DateKeyValue | undefined {
        let value = val.trim();
        if (value === "") {
            value = "=" + new Date();
        }
        value = value.replace(/\s/g, ""); // remove spaces
        const match = value.replace("≥", ">=")
            .replace("≤", "<=")
            .replace("<>", "!=")
            .replace("≠", "!=")
            .replace("==", "=")
            .match(/^(<=|<|>=|>|!=|=)?(.+)/);

        if (match) {
            const parsedDate = moment.utc(match[2], this._dateParseFormats, true);
            if (parsedDate.isValid()) {
                return {
                    operator: match[1] as Operator || "=",
                    date: parsedDate.toDate(),
                };
            } else {
                return undefined;
            }
        } else {
            return undefined;
        }
    }

    public checkValue(val: any): DateKeyValue | undefined {
        if (Object.keys(symbolForOperator).includes(val.operator) && val.date instanceof Date && !isNaN(val.date)) {
            return val;
        } else {
            return undefined;
        }
    }

    public display(value: SlackDateKeyValue): KeyValueTextDisplay {
        return { text: toSymbol(value.operator) + " " + moment(value.date).format(this._dateFormat) };
    }

    public editText(value: SlackDateKeyValue): string {
        return this.display(value).text;
    }
}
