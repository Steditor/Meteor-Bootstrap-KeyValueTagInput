import {
    CompOperator,
    compOperators,
    compOpsAndSymbols,
    CompOpSymbol,
    compOpToSelector, compOpToSymbol,
} from "../helpers/operators";
import { KeyValueSuggestion, KeyValueTextDisplay } from "./KeyValueDatatypes";
import { KeyValueType } from "./KeyValueType";

import moment from "moment";

interface SlackDateKeyValue {
    operator: CompOpSymbol | CompOperator;
    date: Date;
}
interface DateKeyValue extends SlackDateKeyValue {
    operator: CompOperator;
}

export default class DateKeyValueType extends KeyValueType<DateKeyValue> {
    public static mongoSelectorFor(value: DateKeyValue) {
        return { [compOpToSelector(value.operator)]: value.date };
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
            let operators = Object.keys(compOperators) as Array<CompOpSymbol | CompOperator>;
            if (prefix !== "") {
                date = parsed ? parsed.date : date;
                const filteredOperators = compOpsAndSymbols.filter((op) => op.startsWith(prefix));
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
                    operator: match[1] as CompOperator ?? "=",
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
        if (Object.keys(compOperators).includes(val.operator) && val.date instanceof Date && !isNaN(val.date)) {
            return val;
        } else {
            return undefined;
        }
    }

    public display(value: SlackDateKeyValue): KeyValueTextDisplay {
        return { text: compOpToSymbol(value.operator) + " " + moment(value.date).format(this._dateFormat) };
    }

    public editText(value: SlackDateKeyValue): string {
        return this.display(value).text;
    }
}
